import { classifyTags, type CategoryId, SEARCH_CATEGORY } from "./categories.ts";
import type { OverpassResponse } from "./overpass.ts";

export type PlaceCategory = CategoryId | typeof SEARCH_CATEGORY;

export type Place = {
  id: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  opening_hours?: string;
  phone?: string;
  kind?: string;
};

const PER_CATEGORY_CAP = 10;

export function placesFromOverpass(payload: OverpassResponse): Place[] {
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  const places: Place[] = [];

  for (const element of payload.elements ?? []) {
    if (element.type !== "node" && element.type !== "way") continue;
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (lat == null || lng == null) continue;
    const tags = element.tags ?? {};
    const category = classifyTags(tags);
    if (!category) continue;
    const id = `${element.type}/${element.id}`;
    if (seen.has(id)) continue;
    const used = counts.get(category) ?? 0;
    if (used >= PER_CATEGORY_CAP) continue;
    seen.add(id);
    counts.set(category, used + 1);
    places.push({
      id,
      name: tags.name || tags["name:en"] || tags["name:vi"] || "",
      nameVi: tags["name:vi"] || undefined,
      nameEn: tags["name:en"] || undefined,
      category,
      lat,
      lng,
      opening_hours: cleanTag(tags.opening_hours, 300),
      phone: cleanTag(tags.phone || tags["contact:phone"] || tags["contact:mobile"], 40),
      kind: tags.cuisine || tags.amenity || tags.tourism || tags.shop,
    });
  }

  return places;
}

function cleanTag(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export type NominatimItem = {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  type?: string;
  category?: string;
};

export function placesFromNominatim(items: NominatimItem[]): Place[] {
  const places: Place[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.osm_type || item.osm_id == null || !item.lat || !item.lon) continue;
    if (!["node", "way", "relation"].includes(item.osm_type)) continue;
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const id = `${item.osm_type}/${item.osm_id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const fallback = item.display_name?.split(",")[0]?.trim() || "";
    places.push({
      id,
      name: item.name || fallback,
      category: SEARCH_CATEGORY,
      lat,
      lng,
      kind: item.type || item.category,
    });
    if (places.length >= 10) break;
  }
  return places;
}
