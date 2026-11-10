import { CATEGORIES, type CategoryId, isCategoryId } from "./categories.ts";
import type { BBox } from "./bbox.ts";

const PER_CATEGORY_LIMIT = 10;

export type LatLng = [lat: number, lng: number];

export function parseCategoryList(value: string | null): CategoryId[] | null {
  if (!value) return null;
  const seen = new Set<CategoryId>();
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!id) continue;
    if (!isCategoryId(id)) return null;
    seen.add(id);
  }
  if (seen.size === 0) return null;
  return CATEGORIES.map((category) => category.id).filter((id) => seen.has(id));
}

/**
 * One Overpass request, with a separate union + `out center` per category
 * so each category is capped on its own.
 */
export function buildOverpassQuery(
  bbox: BBox,
  categories: readonly CategoryId[],
  limit = PER_CATEGORY_LIMIT,
): string {
  const unique = uniqueCategories(categories);
  const [south, west, north, east] = bbox;
  return renderQuery(unique, `(${south},${west},${north},${east})`, limit);
}

/** Same category unions as a bbox search, limited to an explicit polygon. */
export function buildOverpassPolyQuery(
  points: readonly LatLng[],
  categories: readonly CategoryId[],
  limit = PER_CATEGORY_LIMIT,
): string {
  if (points.length < 3) throw new Error("A polygon needs at least 3 points");
  const unique = uniqueCategories(categories);
  const ring = points.map(([lat, lng]) => `${lat.toFixed(5)} ${lng.toFixed(5)}`).join(" ");
  return renderQuery(unique, `(poly:"${ring}")`, limit);
}

function uniqueCategories(categories: readonly CategoryId[]): CategoryId[] {
  if (categories.length === 0) throw new Error("At least one category is required");
  const unique = [...new Set(categories)];
  for (const category of unique) {
    if (!isCategoryId(category)) throw new Error(`Unknown category ${category}`);
  }
  return unique;
}

function renderQuery(categories: readonly CategoryId[], location: string, limit: number): string {
  const blocks = categories.map((categoryId) => {
    const category = CATEGORIES.find((item) => item.id === categoryId)!;
    const types = categoryId === "stations" ? (["node", "way", "relation"] as const) : (["node", "way"] as const);
    const clauses = category.filters.flatMap(([key, value]) =>
      types.map((type) => `  ${type}["${key}"="${value}"]${location};`),
    );
    return `(\n${clauses.join("\n")}\n);\nout center ${limit};`;
  });
  return `[out:json][timeout:25];\n${blocks.join("\n")}`;
}

export type OverpassMember = {
  type?: string;
  role?: string;
  geometry?: { lat: number; lon: number }[];
};

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  members?: OverpassMember[];
};

export type OverpassResponse = {
  elements?: OverpassElement[];
  remark?: string;
};
