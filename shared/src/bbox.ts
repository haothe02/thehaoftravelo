export type BBox = [south: number, west: number, north: number, east: number];

export const VIETNAM_BOUNDS = {
  south: 7.5,
  west: 102,
  north: 23.8,
  east: 110.5,
} as const;

export const MAX_BBOX_SPAN = 1;

export function parseBBox(value: string | null): BBox | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;
  const [south, west, north, east] = parts;
  if (south < -90 || north > 90 || west < -180 || east > 180) return null;
  if (south >= north || west >= east) return null;
  return [south, west, north, east];
}

export function isInsideVietnam(bbox: BBox): boolean {
  return (
    bbox[0] >= VIETNAM_BOUNDS.south &&
    bbox[2] <= VIETNAM_BOUNDS.north &&
    bbox[1] >= VIETNAM_BOUNDS.west &&
    bbox[3] <= VIETNAM_BOUNDS.east
  );
}

export function bboxSpanTooLarge(bbox: BBox, maxSpan = MAX_BBOX_SPAN): boolean {
  return bbox[2] - bbox[0] > maxSpan || bbox[3] - bbox[1] > maxSpan;
}

/** Pad tiny views and round so cache keys stay stable (~110m). */
export function normalizeBBox(bbox: BBox): BBox {
  let [south, west, north, east] = bbox;
  const minSpan = 0.01;
  if (north - south < minSpan) {
    const center = (north + south) / 2;
    south = center - minSpan / 2;
    north = center + minSpan / 2;
  }
  if (east - west < minSpan) {
    const center = (east + west) / 2;
    west = center - minSpan / 2;
    east = center + minSpan / 2;
  }
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return [round(south), round(west), round(north), round(east)];
}

export function pointInsideBBox(lat: number, lng: number, bbox: BBox): boolean {
  return lat >= bbox[0] && lat <= bbox[2] && lng >= bbox[1] && lng <= bbox[3];
}
