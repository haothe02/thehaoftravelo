import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { BBox } from "@shared/bbox";
import { CATEGORY_ORDER, type CategoryId } from "@shared/categories";
import { cityById, type City, type CityId } from "@shared/cities";
import { buildMapLink, parseMapLink } from "@shared/deeplink";
import { applyOpenNowFilter } from "@shared/openingHours";
import type { Place } from "@shared/places";
import { fetchPlace, fetchPlaces, fetchWeather, postCityOpened, searchPlaces, type Weather } from "../lib/api";

export const HOME_VIEW = {
  longitude: 106.15,
  latitude: 15.7,
  zoom: 5.25,
  pitch: 0,
  bearing: 0,
};

export function mapPadding(): { top: number; bottom: number; left: number; right: number } {
  const wide = window.matchMedia("(min-width: 768px)").matches;
  return wide
    ? { top: 84, bottom: 28, left: 448, right: 28 }
    : { top: 76, bottom: 420, left: 16, right: 16 };
}

type Intent = "none" | "load" | "ignore";

function allCategoriesOn(): Record<CategoryId, boolean> {
  return Object.fromEntries(CATEGORY_ORDER.map((id) => [id, true])) as Record<CategoryId, boolean>;
}

function viewFor(cityId: CityId | null) {
  if (!cityId) return HOME_VIEW;
  const city = cityById(cityId);
  return {
    longitude: city.center[0],
    latitude: city.center[1],
    zoom: city.zoom,
    pitch: 42,
    bearing: 0,
  };
}

export function useExplorer() {
  const mapRef = useRef<MapRef>(null);
  const intent = useRef<Intent>("none");
  const settled = useRef(false);
  const hasPlaces = useRef(false);
  const [link, setLink] = useState(() => parseMapLink(window.location.search));
  const [initialView] = useState(() => ({
    ...viewFor(parseMapLink(window.location.search).city),
    padding: mapPadding(),
  }));
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchHits, setSearchHits] = useState<Place[]>([]);
  const [fetchedPlace, setFetchedPlace] = useState<Place | null>(null);
  const [categories, setCategories] = useState(allCategoriesOn);
  const [openNow, setOpenNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areaDirty, setAreaDirty] = useState(false);
  const [weatherState, setWeatherState] = useState<{ cityId: CityId; weather: Weather | null } | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const city: City | null = link.city ? cityById(link.city) : null;
  const weather = weatherState && city && weatherState.cityId === city.id ? weatherState.weather : null;

  const writeLink = useCallback((cityId: CityId | null, place: string | null, mode: "push" | "replace" = "push") => {
    const next = buildMapLink(cityId, place);
    const path = `${window.location.pathname}${next === "/" ? "" : next}`;
    if (`${window.location.pathname}${window.location.search}` !== path) {
      if (mode === "push") history.pushState(null, "", path);
      else history.replaceState(null, "", path);
    }
    setLink({ city: cityId, place });
  }, []);

  useEffect(() => {
    const onPop = () => setLink(parseMapLink(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!city) return;
    const cityId = city.id;
    postCityOpened(cityId);
    let cancelled = false;
    fetchWeather(city.center[1], city.center[0])
      .then((next) => {
        if (!cancelled) setWeatherState({ cityId, weather: next });
      })
      .catch(() => {
        if (!cancelled) setWeatherState({ cityId, weather: null });
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const loadViewport = useCallback(async () => {
    const map = mapRef.current?.getMap();
    const bounds = map?.getBounds();
    if (!bounds) return;
    const bbox: BBox = [
      bounds.getSouth(),
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast(),
    ];
    setLoading(true);
    setError(null);
    try {
      setPlaces(await fetchPlaces(bbox));
      setAreaDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const onMapLoad = useCallback(() => {
    if (link.city) void loadViewport();
  }, [link.city, loadViewport]);

  const onMoveEnd = useCallback(() => {
    if (intent.current === "load") {
      intent.current = "none";
      void loadViewport();
      return;
    }
    if (intent.current === "ignore") {
      intent.current = "none";
      return;
    }
    if (!settled.current) {
      settled.current = true;
      return;
    }
    if (link.city || hasPlaces.current) setAreaDirty(true);
  }, [link.city, loadViewport]);

  useEffect(() => {
    hasPlaces.current = places.length > 0;
  }, [places.length]);

  const selectCity = useCallback(
    (id: CityId) => {
      const next = cityById(id);
      setSearchHits([]);
      setSheetExpanded(false);
      writeLink(id, null);
      intent.current = "load";
      mapRef.current?.flyTo({
        center: next.center,
        zoom: next.zoom,
        pitch: 42,
        bearing: 0,
        padding: mapPadding(),
        duration: 1400,
        essential: true,
      });
    },
    [writeLink],
  );

  const goHome = useCallback(() => {
    setPlaces([]);
    setSearchHits([]);
    setAreaDirty(false);
    setError(null);
    writeLink(null, null);
    intent.current = "ignore";
    mapRef.current?.flyTo({ ...HOME_VIEW, padding: mapPadding(), duration: 1100, essential: true });
  }, [writeLink]);

  const selectPlace = useCallback(
    (place: Place) => {
      if (!link.city && place.category === "search") return;
      writeLink(link.city, place.id);
      intent.current = "ignore";
      const zoom = mapRef.current?.getMap()?.getZoom() ?? 13;
      mapRef.current?.flyTo({
        center: [place.lng, place.lat],
        zoom: Math.max(zoom, 12.8),
        pitch: 48,
        padding: mapPadding(),
        duration: 700,
        essential: true,
      });
    },
    [link.city, writeLink],
  );

  const clearPlace = useCallback(() => {
    writeLink(link.city, null);
  }, [link.city, writeLink]);

  const toggleCategory = useCallback((id: CategoryId) => {
    setCategories((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  const searchInCity = useCallback(
    async (query: string) => {
      if (!city) return;
      const bbox: BBox = [city.bounds.south, city.bounds.west, city.bounds.north, city.bounds.east];
      setLoading(true);
      setError(null);
      try {
        const hits = await searchPlaces(query, bbox);
        setSearchHits(hits);
        if (hits[0]) selectPlace(hits[0]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Request failed");
      } finally {
        setLoading(false);
      }
    },
    [city, selectPlace],
  );

  const clearSearch = useCallback(() => setSearchHits([]), []);

  const nearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("geo");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        intent.current = "load";
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14.5,
          pitch: 30,
          padding: mapPadding(),
          duration: 1000,
          essential: true,
        });
      },
      () => setError("geo-denied"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, []);

  const fitCity = useCallback(() => {
    if (!city) return;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    intent.current = "ignore";
    setAreaDirty(true);
    mapRef.current?.fitBounds(
      [
        [city.bounds.west, city.bounds.south],
        [city.bounds.east, city.bounds.north],
      ],
      {
        padding: wide
          ? { top: 90, bottom: 48, left: 460, right: 48 }
          : { top: 80, bottom: 300, left: 28, right: 28 },
        pitch: 42,
        duration: 900,
      },
    );
  }, [city]);

  const filtered = useMemo(() => {
    const visible = places.filter((place) => {
      if (place.category === "search") return true;
      return categories[place.category as CategoryId] !== false;
    });
    const result = applyOpenNowFilter(visible, openNow);
    result.places.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.category as CategoryId);
      const bIndex = CATEGORY_ORDER.indexOf(b.category as CategoryId);
      const byCategory = (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
      if (byCategory !== 0) return byCategory;
      return (a.name || "").localeCompare(b.name || "");
    });
    return result;
  }, [places, categories, openNow]);

  const visiblePlaces = useMemo(() => {
    const ids = new Set(filtered.places.map((place) => place.id));
    const extra = searchHits.filter((place) => !ids.has(place.id));
    return [...filtered.places, ...extra];
  }, [filtered.places, searchHits]);

  useEffect(() => {
    if (!link.place) return;
    if (visiblePlaces.some((place) => place.id === link.place) || fetchedPlace?.id === link.place) return;
    let cancelled = false;
    fetchPlace(link.place)
      .then((place) => {
        if (!cancelled) setFetchedPlace(place);
      })
      .catch(() => {
        if (!cancelled) setFetchedPlace(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link.place, visiblePlaces, fetchedPlace?.id]);

  const selected =
    visiblePlaces.find((place) => place.id === link.place) ||
    (link.place && fetchedPlace?.id === link.place ? fetchedPlace : null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  return {
    mapRef,
    initialView,
    city,
    placeId: link.place,
    selected,
    places: visiblePlaces,
    searchHits,
    categories,
    openNow,
    setOpenNow,
    loading,
    error,
    setError,
    areaDirty,
    weather,
    sheetExpanded,
    setSheetExpanded,
    toast,
    showToast,
    feedbackOpen,
    setFeedbackOpen,
    hiddenForMissingHours: filtered.hiddenForMissingHours,
    onMapLoad,
    onMoveEnd,
    selectCity,
    goHome,
    selectPlace,
    clearPlace,
    toggleCategory,
    searchInCity,
    clearSearch,
    nearMe,
    fitCity,
    loadViewport,
  };
}
