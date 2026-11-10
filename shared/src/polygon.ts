import type { LatLng } from "./overpass.ts";
import { pointInVietnam } from "./vietnam.ts";

/** About 50 km. Wider than this and a poly filter tends to time out. */
export const MAX_POLY_SPAN = 0.45;
/** Roughly a 35 km square. */
export const MAX_POLY_AREA_KM2 = 1200;
/** Smaller than a few city blocks is not a useful search. */
export const MIN_POLY_AREA_KM2 = 0.04;
export const MAX_POLY_POINTS = 48;

export type PolyProblem = "bad_poly" | "area_outside" | "area_too_large" | "area_too_small";

export function parsePolyParam(value: string | null): LatLng[] | null {
  if (!value || value.length > 4_000) return null;
  const points: LatLng[] = [];
  for (const part of value.split(";")) {
    const bits = part.split(",");
    if (bits.length !== 2) return null;
    const lat = Number(bits[0]);
    const lng = Number(bits[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    points.push([lat, lng]);
  }
  if (points.length < 3 || points.length > 60) return null;
  return points;
}

export function assessPolygon(points: readonly LatLng[]): PolyProblem | null {
  if (points.length < 3) return "bad_poly";
  if (points.some(([lat, lng]) => !pointInVietnam(lat, lng))) return "area_outside";
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  if (latSpan > MAX_POLY_SPAN || lngSpan > MAX_POLY_SPAN) return "area_too_large";
  const area = polygonAreaKm2(points);
  if (area > MAX_POLY_AREA_KM2) return "area_too_large";
  if (area < MIN_POLY_AREA_KM2) return "area_too_small";
  return null;
}

export function polygonAreaKm2(points: readonly LatLng[]): number {
  if (points.length < 3) return 0;
  const midLat = (points.reduce((sum, [lat]) => sum + lat, 0) / points.length) * (Math.PI / 180);
  const kx = 111.32 * Math.cos(midLat);
  const ky = 110.57;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [, x1] = points[index];
    const [y1] = points[index];
    const next = points[(index + 1) % points.length];
    const [, x2] = next;
    const [y2] = next;
    sum += x1 * kx * y2 * ky - x2 * kx * y1 * ky;
  }
  return Math.abs(sum) / 2;
}

/** Keep the shape, drop points until Overpass gets a short ring. */
export function simplifyRing(points: readonly LatLng[], maxPoints = 40): LatLng[] {
  if (points.length <= maxPoints) return points.map((point) => [point[0], point[1]]);
  let epsilon = 0.00035;
  let simplified = rdp(points, epsilon);
  while (simplified.length > maxPoints && epsilon < 0.02) {
    epsilon *= 1.7;
    simplified = rdp(points, epsilon);
  }
  if (simplified.length > maxPoints) {
    const step = Math.ceil(simplified.length / maxPoints);
    const sampled = simplified.filter((_, index) => index % step === 0);
    const last = simplified[simplified.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    return sampled;
  }
  return simplified;
}

function rdp(points: readonly LatLng[], epsilon: number): LatLng[] {
  if (points.length < 3) return points.map((point) => [point[0], point[1]]);
  let maxDistance = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let cursor = 1; cursor < points.length - 1; cursor += 1) {
    const distance = perpendicularDistance(points[cursor], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = cursor;
    }
  }
  if (maxDistance > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [
    [first[0], first[1]],
    [last[0], last[1]],
  ];
}

function perpendicularDistance(point: LatLng, start: LatLng, end: LatLng): number {
  const [y, x] = point;
  const [y1, x1] = start;
  const [y2, x2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
