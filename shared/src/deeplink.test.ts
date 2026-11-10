import { describe, expect, it } from "vitest";
import { CITY_IDS } from "./cities.ts";
import { buildMapLink, parseMapLink } from "./deeplink.ts";

describe("map deep links", () => {
  it("round-trips a city and a place id", () => {
    const link = buildMapLink("hoi-an", "node/123");
    expect(link).toBe("?city=hoi-an&place=node%2F123");
    expect(parseMapLink(link)).toEqual({ city: "hoi-an", place: "node/123" });
    expect(parseMapLink("?city=hoi-an&place=way/99")).toEqual({
      city: "hoi-an",
      place: "way/99",
    });
  });

  it("drops unknown cities and malformed place ids", () => {
    expect(parseMapLink("?city=paris&place=123")).toEqual({ city: null, place: null });
    expect(parseMapLink("?place=relation/42")).toEqual({ city: null, place: "relation/42" });
    expect(parseMapLink("")).toEqual({ city: null, place: null });
    expect(buildMapLink(null, null)).toBe("/");
  });

  it("accepts every launch city", () => {
    expect(CITY_IDS).toHaveLength(11);
    for (const id of CITY_IDS) {
      expect(parseMapLink(`?city=${id}`).city).toBe(id);
    }
  });
});
