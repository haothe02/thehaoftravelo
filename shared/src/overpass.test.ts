import { describe, expect, it } from "vitest";
import { buildOverpassPolyQuery, buildOverpassQuery, parseCategoryList } from "./overpass.ts";
import { placesFromOverpass } from "./places.ts";
import { assessPolygon, parsePolyParam } from "./polygon.ts";

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

  it("asks stations for public aerodromes, railway stations, and bus stations", () => {
    const query = buildOverpassQuery(hoiAn, ["stations"]);
    expect(query).toContain('node["aeroway"="aerodrome"]');
    expect(query).toContain('way["railway"="station"]');
    expect(query).toContain('relation["amenity"="bus_station"]');
    expect(query.match(/out center 10;/g)).toHaveLength(1);
  });
});

describe("buildOverpassPolyQuery", () => {
  const ring: [number, number][] = [
    [15.88, 108.32],
    [15.9, 108.32],
    [15.9, 108.35],
  ];

  it("uses a poly filter and keeps the per-category cap", () => {
    const query = buildOverpassPolyQuery(ring, ["restaurants", "stations"]);
    expect(query).toContain('(poly:"15.88000 108.32000 15.90000 108.32000 15.90000 108.35000")');
    expect(query).not.toContain("(15.85,");
    expect(query).toContain('relation["railway"="station"](poly:');
    expect(query.match(/out center 10;/g)).toHaveLength(2);
  });
});

describe("polygon limits", () => {
  it("accepts a neighbourhood inside Vietnam", () => {
    const points = parsePolyParam("15.88000,108.32000;15.90000,108.32000;15.90000,108.35000");
    expect(points).toHaveLength(3);
    expect(assessPolygon(points!)).toBeNull();
  });

  it("refuses a shape that would make Overpass time out", () => {
    expect(
      assessPolygon([
        [21.03, 105.85],
        [16.06, 108.22],
        [20.95, 107.05],
      ]),
    ).toBe("area_too_large");
  });

  it("refuses a shape in Laos even when it sits inside the Vietnam rectangle", () => {
    expect(
      assessPolygon([
        [16.5, 104.7],
        [16.6, 104.7],
        [16.6, 104.85],
      ]),
    ).toBe("area_outside");
  });

  it("refuses a shape outside Vietnam and a tiny scribble", () => {
    expect(
      assessPolygon([
        [48.8, 2.3],
        [48.9, 2.3],
        [48.9, 2.4],
      ]),
    ).toBe("area_outside");
    expect(
      assessPolygon([
        [15.88, 108.33],
        [15.8801, 108.33],
        [15.8801, 108.3301],
      ]),
    ).toBe("area_too_small");
    expect(parsePolyParam("nope")).toBeNull();
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

  it("keeps public stations, including relation centers, and drops military airfields", () => {
    const places = placesFromOverpass({
      elements: [
        {
          type: "relation",
          id: 9,
          center: { lat: 21.218, lon: 105.804 },
          tags: { aeroway: "aerodrome", name: "Nội Bài", iata: "HAN", opening_hours: "24/7" },
        },
        {
          type: "node",
          id: 3,
          lat: 21.02,
          lon: 105.84,
          tags: { railway: "station", name: "Ga Hà Nội", opening_hours: "Mo-Su 04:00-23:00" },
        },
        {
          type: "node",
          id: 4,
          lat: 21.03,
          lon: 105.85,
          tags: { amenity: "bus_station", name: "Giáp Bát" },
        },
        {
          type: "node",
          id: 5,
          lat: 10.97,
          lon: 106.82,
          tags: { aeroway: "aerodrome", aerodrome: "military", military: "airfield", name: "Biên Hòa" },
        },
        {
          type: "node",
          id: 6,
          lat: 21.03,
          lon: 105.85,
          tags: { railway: "station", station: "subway", name: "Cát Linh" },
        },
      ],
    });
    expect(places.map((place) => place.name)).toEqual(["Nội Bài", "Ga Hà Nội", "Giáp Bát"]);
    expect(places[0]).toMatchObject({ id: "relation/9", category: "stations", kind: "airport", opening_hours: "24/7" });
    expect(places[1]).toMatchObject({ kind: "train" });
    expect(places[2]).toMatchObject({ kind: "bus" });
  });
});
