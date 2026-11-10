import { useEffect, useMemo, useState, type RefObject } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";
import type { FilterSpecification } from "maplibre-gl";
import { CITIES, type City } from "@shared/cities";
import type { Place } from "@shared/places";
import { useTranslation } from "react-i18next";
import { installPinIcons } from "../lib/pins";
import { PlaceCard } from "./PlaceCard";

const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

type Props = {
  mapRef: RefObject<MapRef | null>;
  initialView: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  theme: "light" | "dark";
  city: City | null;
  places: Place[];
  selected: Place | null;
  onLoad: () => void;
  onMoveEnd: () => void;
  onSelectCity: (id: City["id"]) => void;
  onSelectPlace: (place: Place) => void;
  onClearPlace: () => void;
  onShared: (kind: "shared" | "copied") => void;
};

export function MapCanvas({
  mapRef,
  initialView,
  theme,
  city,
  places,
  selected,
  onLoad,
  onMoveEnd,
  onSelectCity,
  onSelectPlace,
  onClearPlace,
  onShared,
}: Props) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("vi") ? "vi" : "en";
  const [boundaries, setBoundaries] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/boundaries/cities.geojson")
      .then((response) => response.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const add = () => installPinIcons(map);
    add();
    map.on("style.load", add);
    return () => {
      map.off("style.load", add);
    };
  }, [mapRef, theme, boundaries]);

  const selectedBoundary = useMemo(() => {
    if (!boundaries || !city) return null;
    const feature = boundaries.features.find((item) => item.properties?.id === city.id);
    if (!feature) return null;
    return { type: "FeatureCollection" as const, features: [feature] };
  }, [boundaries, city]);

  const points = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: CITIES.map((item) => ({
        type: "Feature" as const,
        properties: { id: item.id, nameVi: item.nameVi, nameEn: item.nameEn },
        geometry: { type: "Point" as const, coordinates: item.center },
      })),
    }),
    [],
  );

  const pins = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: places.map((place) => ({
        type: "Feature" as const,
        properties: { id: place.id, category: place.category },
        geometry: { type: "Point" as const, coordinates: [place.lng, place.lat] },
      })),
    }),
    [places],
  );

  const boundaryFilter: FilterSpecification = city ? ["==", ["get", "id"], city.id] : ["has", "id"];
  const glow = theme === "dark" ? "#f5b942" : "#e39b12";

  return (
    <Map
      ref={mapRef}
      initialViewState={initialView}
      mapStyle={theme === "dark" ? DARK_STYLE : LIGHT_STYLE}
      attributionControl={{ compact: false }}
      interactiveLayerIds={["city-fill", "pins"]}
      onLoad={() => {
        const map = mapRef.current?.getMap();
        if (map) {
          installPinIcons(map);
          map.on("style.load", () => installPinIcons(map));
        }
        onLoad();
      }}
      onMoveEnd={onMoveEnd}
      onClick={(event) => {
        const feature = event.features?.[0];
        if (!feature) {
          onClearPlace();
          return;
        }
        if (feature.layer?.id === "pins") {
          const place = places.find((item) => item.id === feature.properties?.id);
          if (place) onSelectPlace(place);
          return;
        }
        const id = feature.properties?.id as City["id"] | undefined;
        if (id && id !== city?.id) onSelectCity(id);
        else onClearPlace();
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" showCompass visualizePitch />
      {boundaries ? (
        <Source id="cities" type="geojson" data={boundaries}>
          <Layer
            id="city-fill"
            type="fill"
            filter={boundaryFilter}
            paint={{
              "fill-color": glow,
              "fill-opacity": city ? 0.1 : 0.07,
            }}
          />
          <Layer
            id="city-glow-wide"
            type="line"
            filter={boundaryFilter}
            paint={{
              "line-color": glow,
              "line-width": city ? 22 : 14,
              "line-opacity": 0.18,
              "line-blur": 8,
            }}
          />
          <Layer
            id="city-glow"
            type="line"
            filter={boundaryFilter}
            paint={{
              "line-color": glow,
              "line-width": city ? 8 : 5,
              "line-opacity": 0.55,
              "line-blur": 2,
            }}
          />
          <Layer
            id="city-edge"
            type="line"
            filter={boundaryFilter}
            paint={{
              "line-color": glow,
              "line-width": city ? 2.5 : 1.6,
              "line-opacity": 0.95,
            }}
          />
        </Source>
      ) : null}
      {selectedBoundary ? (
        <Source id="city-raised" type="geojson" data={selectedBoundary}>
          <Layer
            id="city-extrusion"
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": glow,
              "fill-extrusion-height": 120,
              "fill-extrusion-opacity": theme === "dark" ? 0.16 : 0.2,
            }}
          />
        </Source>
      ) : null}
      <Source id="city-points" type="geojson" data={points}>
        <Layer
          id="city-labels"
          type="symbol"
          minzoom={6.2}
          layout={{
            "text-field": ["get", language === "vi" ? "nameVi" : "nameEn"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 13,
            "text-offset": [0, 1.15],
            "text-anchor": "top",
            "text-optional": true,
          }}
          paint={{
            "text-color": theme === "dark" ? "#fff8ef" : "#2a2118",
            "text-halo-color": theme === "dark" ? "#1a1410" : "#fff8ef",
            "text-halo-width": 1.3,
          }}
        />
      </Source>
      {!city
        ? CITIES.map((item) => (
            <Marker key={item.id} longitude={item.center[0]} latitude={item.center[1]} anchor="center">
              <button
                type="button"
                className="city-pin"
                aria-label={language === "vi" ? item.nameVi : item.nameEn}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectCity(item.id);
                }}
              >
                <span className="city-pin-halo" />
                <span className="city-pin-core" />
              </button>
            </Marker>
          ))
        : null}
      <Source id="pins" type="geojson" data={pins}>
        <Layer
          id="pins"
          type="symbol"
          layout={{
            "icon-image": ["concat", "pin-", ["get", "category"]],
            "icon-size": ["case", ["==", ["get", "id"], selected?.id ?? ""], 0.78, 0.58],
            "icon-allow-overlap": true,
          }}
        />
      </Source>
      {selected ? (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={18}
          onClose={onClearPlace}
          closeOnClick={false}
        >
          <PlaceCard place={selected} cityId={city?.id ?? null} onShared={onShared} />
        </Popup>
      ) : null}
    </Map>
  );
}
