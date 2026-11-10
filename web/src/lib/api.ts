import type { BBox } from "@shared/bbox";
import type { BusRoute } from "@shared/busRoutes";
import { CATEGORY_ORDER } from "@shared/categories";
import type { LatLng } from "@shared/overpass";
import type { Place } from "@shared/places";
import type { CityId } from "@shared/cities";

const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export type Weather = {
  temperature: number | null;
  weatherCode: number | null;
  high: number | null;
  low: number | null;
};

type ErrorBody = { error?: string; message?: string };

export class ApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok) {
    throw new ApiError(data.error || "request", data.message || `Request failed (${response.status})`);
  }
  return data;
}

export function fetchPlaces(bbox: BBox): Promise<Place[]> {
  const params = new URLSearchParams({
    bbox: bbox.map((value) => value.toFixed(5)).join(","),
    categories: CATEGORY_ORDER.join(","),
  });
  return request<{ places: Place[] }>(`/api/places?${params}`).then((data) => data.places);
}

export function fetchPlacesInPolygon(points: readonly LatLng[]): Promise<Place[]> {
  const params = new URLSearchParams({
    poly: points.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(";"),
    categories: CATEGORY_ORDER.join(","),
  });
  return request<{ places: Place[] }>(`/api/places?${params}`).then((data) => data.places);
}

export function fetchBusRoutes(city: CityId): Promise<BusRoute[]> {
  return request<{ routes: BusRoute[] }>(`/api/bus-routes?city=${city}`).then((data) => data.routes);
}

export function fetchPlace(id: string): Promise<Place> {
  return request<{ place: Place }>(`/api/places?id=${encodeURIComponent(id)}`).then((data) => data.place);
}

export function searchPlaces(query: string, bbox: BBox): Promise<Place[]> {
  const params = new URLSearchParams({
    q: query,
    bbox: bbox.join(","),
  });
  return request<{ places: Place[] }>(`/api/search?${params}`).then((data) => data.places);
}

export function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const params = new URLSearchParams({
    lat: lat.toFixed(5),
    lng: lng.toFixed(5),
  });
  return request<Weather>(`/api/weather?${params}`);
}

export function postFeedback(body: {
  message: string;
  contact?: string;
  context: Record<string, unknown>;
}): Promise<void> {
  return request("/api/feedback", { method: "POST", body: JSON.stringify(body) }).then(() => undefined);
}

export function postCityOpened(city: string): void {
  const key = `tht-opened:${city}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
  void fetch(`${base}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "city_opened", city }),
  }).catch(() => undefined);
}
