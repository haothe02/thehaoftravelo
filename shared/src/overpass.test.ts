import { describe, expect, it } from "vitest";
import { buildOverpassQuery, parseCategoryList } from "./overpass.ts";
import { placesFromOverpass } from "./places.ts";

const hoiAn: [number, number, number, number] = [15.85, 108.3, 15.9, 108.36];

describe("buildOverpassQuery", () => {
  it("emits one capped union per category in south,west,north,east order", () => {
    const query = buildOverpassQuery(hoiAn, ["restaurants", "hospitals"]);
    expect(query).toContain("[out:json][timeout:25];");
    expect(query).toContain('node["amenity"="restaurant"](15.85,108.3,15.9,108.36);');
    expect(query).toContain('way["amenity"="cafe"](15.85,108.3,15.9,108.36);');
    expect(query).toContain('node["amenity"="fast_food"](15.85,108.3,15.9,108.36);');
    expect(query).toContain('node["amenity"="hospital"](15.85,108.3,15.9,108.36);');
    expect(query).toContain('way["amenity"="clinic"](15.85,108.3,15.9,108.36);');
    expect(query.match(/out center 10;/g)).toHaveLength(2);
  });

  it("asks shops only for the preferred shop types", () => {
    const query = buildOverpassQuery(hoiAn, ["shops"]);
    for (const shop of ["convenience", "supermarket", "marketplace", "gift", "clothes"]) {
      expect(query).toContain(`["shop"="${shop}"]`);
    }
    expect(query).not.toContain('["shop"]');
    expect(query.match(/out center 10;/g)).toHaveLength(1);
  });

  it("covers homestays, hotels, and fuel", () => {
    const query = buildOverpassQuery(hoiAn, ["homestays", "hotels", "gas"]);
    expect(query).toContain('["tourism"="guest_house"]');
    expect(query).toContain('["tourism"="hostel"]');
    expect(query).toContain('["tourism"="apartment"]');
    expect(query).toContain('["tourism"="hotel"]');
    expect(query).toContain('["tourism"="motel"]');
    expect(query).toContain('["amenity"="fuel"]');
    expect(query.match(/out center 10;/g)).toHaveLength(3);
  });

  it("rejects an empty category list", () => {
    expect(() => buildOverpassQuery(hoiAn, [])).toThrow(/category/i);
  });
});

describe("parseCategoryList", () => {
  it("drops blanks, dedupes, and keeps a stable order", () => {
    expect(parseCategoryList(" hotels, restaurants,hotels ")).toEqual([
      "hotels",
      "restaurants",
    ]);
  });

  it("rejects unknown categories", () => {
    expect(parseCategoryList("restaurants,bars")).toBeNull();
    expect(parseCategoryList("")).toBeNull();
    expect(parseCategoryList(null)).toBeNull();
  });
});

describe("placesFromOverpass", () => {
  it("classifies tags, keeps way centers, and caps each category at 10", () => {
    const elements = [
      ...Array.from({ length: 12 }, (_, index) => ({
        type: "node" as const,
        id: index + 1,
        lat: 15.88,
        lon: 108.33,
        tags: { amenity: "restaurant", name: `Pho ${index}` },
      })),
      {
        type: "way" as const,
        id: 50,
        center: { lat: 15.881, lon: 108.331 },
        tags: { amenity: "hospital", name: "Bệnh viện", phone: " 0235 123 ", opening_hours: "24/7" },
      },
      {
        type: "node" as const,
        id: 9,
        lat: 15.88,
        lon: 108.33,
        tags: { amenity: "cafe", name: "Duplicate id still unique by type" },
      },
    ];
    const places = placesFromOverpass({ elements });
    const restaurants = places.filter((place) => place.category === "restaurants");
    expect(restaurants).toHaveLength(10);
    const hospital = places.find((place) => place.id === "way/50");
    expect(hospital).toMatchObject({
      category: "hospitals",
      name: "Bệnh viện",
      phone: "0235 123",
      opening_hours: "24/7",
      lat: 15.881,
      lng: 108.331,
    });
  });
});
