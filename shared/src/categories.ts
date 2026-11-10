export const CATEGORY_IDS = [
  "restaurants",
  "homestays",
  "hotels",
  "shops",
  "gas",
  "hospitals",
  "stations",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type OsmFilter = readonly [key: string, value: string];

export type CategoryDef = {
  id: CategoryId;
  color: string;
  /** Categories the open-now filter applies to. */
  hoursFilter: boolean;
  filters: readonly OsmFilter[];
};

export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: "hospitals",
    color: "#d64545",
    hoursFilter: false,
    filters: [
      ["amenity", "hospital"],
      ["amenity", "clinic"],
    ],
  },
  {
    id: "gas",
    color: "#3b6fb6",
    hoursFilter: false,
    filters: [["amenity", "fuel"]],
  },
  {
    id: "hotels",
    color: "#e0a100",
    hoursFilter: true,
    filters: [
      ["tourism", "hotel"],
      ["tourism", "motel"],
    ],
  },
  {
    id: "homestays",
    color: "#2f7d57",
    hoursFilter: true,
    filters: [
      ["tourism", "guest_house"],
      ["tourism", "hostel"],
      ["tourism", "apartment"],
    ],
  },
  {
    id: "restaurants",
    color: "#e25b7a",
    hoursFilter: true,
    filters: [
      ["amenity", "restaurant"],
      ["amenity", "cafe"],
      ["amenity", "fast_food"],
    ],
  },
  {
    id: "shops",
    color: "#d97706",
    hoursFilter: false,
    filters: [
      ["shop", "convenience"],
      ["shop", "supermarket"],
      ["shop", "marketplace"],
      ["shop", "gift"],
      ["shop", "clothes"],
    ],
  },
  {
    id: "stations",
    color: "#14919b",
    hoursFilter: false,
    filters: [
      ["aeroway", "aerodrome"],
      ["railway", "station"],
      ["amenity", "bus_station"],
    ],
  },
] as const;

export const SEARCH_CATEGORY = "search" as const;
export const SEARCH_COLOR = "#6d5bd0";

const byId = new Map(CATEGORIES.map((category) => [category.id, category]));

export function isCategoryId(value: string): value is CategoryId {
  return byId.has(value as CategoryId);
}

export function categoryById(id: CategoryId): CategoryDef {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
}

export function classifyTags(
  tags: Record<string, string | undefined>,
): CategoryId | null {
  for (const category of CATEGORIES) {
    for (const [key, value] of category.filters) {
      if (tags[key] === value) return category.id;
    }
  }
  return null;
}

/** Chip display order, food and stay first. */
export const CATEGORY_ORDER: readonly CategoryId[] = [
  "restaurants",
  "homestays",
  "hotels",
  "shops",
  "stations",
  "gas",
  "hospitals",
];
