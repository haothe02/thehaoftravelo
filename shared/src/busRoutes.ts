import type { BBox } from "./bbox.ts";
import type { City } from "./cities.ts";
import type { OverpassElement, OverpassResponse } from "./overpass.ts";

export type BusRoute = {
  id: string;
  ref?: string;
  name: string;
  from?: string;
  to?: string;
  colour?: string;
  coordinates: [lng: number, lat: number][];
};

const STOP_ROLES = new Set([
  "stop",
  "stop_entry_only",
  "stop_exit_only",
  "platform",
  "platform_entry_only",
  "platform_exit_only",
]);

/** Urban core around the camera center, clamped to the city outline. */
export function busQueryBox(city: City, span = 0.22): BBox {
  const [lng, lat] = city.center;
  const south = Math.max(city.bounds.south, lat - span);
  const north = Math.min(city.bounds.north, lat + span);
  const west = Math.max(city.bounds.west, lng - span);
  const east = Math.min(city.bounds.east, lng + span);
  return [south, west, north, east];
}

export function buildBusRouteQuery(bbox: BBox, limit = 15): string {
  const [south, west, north, east] = bbox;
  const box = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];\nrelation["route"="bus"](${box});\nout geom ${limit};`;
}

export function busRoutesFromOverpass(payload: OverpassResponse, maxPoints = 400): BusRoute[] {
  const routes: BusRoute[] = [];
  for (const element of payload.elements ?? []) {
    if (element.type !== "relation") continue;
    const coordinates = lineFromMembers(element, maxPoints);
    if (coordinates.length < 2) continue;
    const tags = element.tags ?? {};
    const name = clean(tags.name) || clean(tags.ref) || "";
    routes.push({
      id: `relation/${element.id}`,
      ref: clean(tags.ref),
      name,
      from: clean(tags.from),
      to: clean(tags.to),
      colour: clean(tags.colour || tags.color),
      coordinates,
    });
  }
  routes.sort((a, b) => (a.ref || a.name).localeCompare(b.ref || b.name, undefined, { numeric: true }));
  return routes;
}

function lineFromMembers(element: OverpassElement, maxPoints: number): [number, number][] {
  const coordinates: [number, number][] = [];
  for (const member of element.members ?? []) {
    if (STOP_ROLES.has(member.role || "")) continue;
    for (const point of member.geometry ?? []) {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;
      const next: [number, number] = [point.lon, point.lat];
      const prev = coordinates[coordinates.length - 1];
      if (prev && prev[0] === next[0] && prev[1] === next[1]) continue;
      coordinates.push(next);
    }
  }
  return decimate(coordinates, maxPoints);
}

function decimate(coordinates: [number, number][], maxPoints: number): [number, number][] {
  if (coordinates.length <= maxPoints) return coordinates;
  const step = Math.ceil(coordinates.length / maxPoints);
  const sampled = coordinates.filter((_, index) => index % step === 0);
  const last = coordinates[coordinates.length - 1];
  const end = sampled[sampled.length - 1];
  if (!end || end[0] !== last[0] || end[1] !== last[1]) sampled.push(last);
  return sampled;
}

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, 160) : undefined;
}
