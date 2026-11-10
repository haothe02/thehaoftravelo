import type { BBox } from "@shared/bbox";
import { CATEGORY_ORDER } from "@shared/categories";
import type { Place } from "@shared/places";

const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export type Weather = {
  temperature: number | null;
  weatherCode: number | null;
  high: number | null;
  low: number | null;
};

type ErrorBody = { message?: string };

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
    throw new Error(data.message || `Request failed (${response.status})`);
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
