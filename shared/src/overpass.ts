import { CATEGORIES, type CategoryId, isCategoryId } from "./categories.ts";
import type { BBox } from "./bbox.ts";

const PER_CATEGORY_LIMIT = 10;

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
  if (categories.length === 0) {
    throw new Error("At least one category is required");
  }
  const unique = [...new Set(categories)];
  for (const category of unique) {
    if (!isCategoryId(category)) throw new Error(`Unknown category ${category}`);
  }
  const [south, west, north, east] = bbox;
  const box = `${south},${west},${north},${east}`;
  const blocks = unique.map((categoryId) => {
    const category = CATEGORIES.find((item) => item.id === categoryId)!;
    const clauses = category.filters.flatMap(([key, value]) => [
      `  node["${key}"="${value}"](${box});`,
      `  way["${key}"="${value}"](${box});`,
    ]);
    return `(\n${clauses.join("\n")}\n);\nout center ${limit};`;
  });
  return `[out:json][timeout:25];\n${blocks.join("\n")}`;
}

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  elements?: OverpassElement[];
  remark?: string;
};
