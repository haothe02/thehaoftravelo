import { useEffect, useMemo, useRef } from "react";
import MapView, { Layer, Source, type MapRef } from "react-map-gl/maplibre";
import type { City } from "@shared/cities";
import type { BusRoute } from "@shared/busRoutes";
import { DARK_STYLE, LIGHT_STYLE } from "../lib/mapStyle";
import type { Theme } from "../lib/theme";

const PALETTE = ["#e39b12", "#1f7a4d", "#3b6fb6", "#d64545", "#6d5bd0", "#14919b", "#e25b7a"];

export function routeColor(colour: string | undefined, index: number): string {
  if (colour && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colour)) return colour;
  return PALETTE[index % PALETTE.length];
}

export function BusRouteMap({
  theme,
  city,
  routes,
  selectedId,
  onSelect,
}: {
  theme: Theme;
  city: City;
  routes: BusRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const colors = useMemo(() => new Map(routes.map((route, index) => [route.id, routeColor(route.colour, index)])), [routes]);
  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: routes.map((route) => ({
        type: "Feature" as const,
        properties: { id: route.id, color: colors.get(route.id) },
        geometry: { type: "LineString" as const, coordinates: route.coordinates },
      })),
    }),
    [routes, colors],
  );

  useEffect(() => {
    const map = mapRef.current?.getMap();
    map?.resize();
  }, [routes]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || routes.length === 0) return;
    const lngs = routes.flatMap((route) => route.coordinates.map((point) => point[0]));
    const lats = routes.flatMap((route) => route.coordinates.map((point) => point[1]));
    if (!lngs.length || !lats.length) return;
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 36, duration: 600, maxZoom: 14 },
    );
  }, [routes]);

  return (
    <MapView
      ref={mapRef}
      initialViewState={{ longitude: city.center[0], latitude: city.center[1], zoom: city.zoom }}
      mapStyle={theme === "dark" ? DARK_STYLE : LIGHT_STYLE}
      attributionControl={{ compact: true }}
      interactiveLayerIds={["bus-routes"]}
      onClick={(event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") onSelect(id);
      }}
      onLoad={() => mapRef.current?.getMap()?.resize()}
      style={{ width: "100%", height: "100%" }}
    >
      <Source id="bus-routes" type="geojson" data={data}>
        <Layer
          id="bus-routes"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ["get", "color"],
            "line-width": ["case", ["==", ["get", "id"], selectedId ?? ""], 6, 3],
            "line-opacity": ["case", ["==", ["get", "id"], selectedId ?? ""], 1, 0.75],
          }}
        />
      </Source>
    </MapView>
  );
}
