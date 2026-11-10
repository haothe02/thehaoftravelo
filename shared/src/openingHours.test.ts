import { describe, expect, it } from "vitest";
import { applyOpenNowFilter, isAlwaysOpen, openState } from "./openingHours.ts";

const wednesdayNoon = new Date("2026-11-11T05:00:00Z");
const wednesdayEvening = new Date("2026-11-11T13:00:00Z");

describe("openState", () => {
  it("reads weekday hours in Vietnam time", () => {
    expect(openState("Mo-Fr 09:00-17:00", wednesdayNoon)).toBe("open");
    expect(openState("Mo-Fr 09:00-17:00", wednesdayEvening)).toBe("closed");
  });

  it("treats missing and unparseable hours as unknown", () => {
    expect(openState(undefined, wednesdayNoon)).toBe("unknown");
    expect(openState("   ", wednesdayNoon)).toBe("unknown");
    expect(openState("not hours", wednesdayNoon)).toBe("unknown");
  });

  it("recognises 24/7", () => {
    expect(openState("24/7", wednesdayEvening)).toBe("open");
    expect(isAlwaysOpen("24/7")).toBe(true);
    expect(isAlwaysOpen("Mo-Su 00:00-24:00")).toBe(true);
    expect(isAlwaysOpen("Mo-Fr 09:00-17:00")).toBe(false);
  });
});

describe("applyOpenNowFilter", () => {
  const places = [
    { id: "open", category: "restaurants", opening_hours: "Mo-Su 08:00-22:00" },
    { id: "closed", category: "hotels", opening_hours: "Mo-Fr 09:00-12:00" },
    { id: "unknown", category: "homestays" },
    { id: "gas", category: "gas" },
    { id: "hospital", category: "hospitals" },
  ];

  it("returns everything when the filter is off", () => {
    const result = applyOpenNowFilter(places, false, wednesdayNoon);
    expect(result.places.map((place) => place.id)).toEqual([
      "open",
      "closed",
      "unknown",
      "gas",
      "hospital",
    ]);
    expect(result.hiddenForMissingHours).toBe(0);
  });

  it("hides closed and hour-less food and stay places, and keeps other categories", () => {
    const result = applyOpenNowFilter(places, true, wednesdayNoon);
    expect(result.places.map((place) => place.id)).toEqual(["open", "gas", "hospital"]);
    expect(result.hiddenForMissingHours).toBe(1);
  });
});
