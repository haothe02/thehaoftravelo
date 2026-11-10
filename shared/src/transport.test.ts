import { describe, expect, it } from "vitest";
import { buildBusRouteQuery, busRoutesFromOverpass } from "./busRoutes.ts";
import { travelCards } from "./transport.ts";
import { buildVehiclesLink, parseVehiclesLink } from "./vehiclesLink.ts";

describe("travel cards", () => {
  const date = "2026-11-21";

  it("prefills Vexere with the route and a DD-MM-YYYY date", () => {
    const [vexere, twelve] = travelCards({ mode: "coach", from: "ha-noi", to: "da-nang", date });
    expect(vexere).toMatchObject({
      id: "vexere",
      prefilled: "route-date",
      href: "https://vexere.com/vi-VN/ve-xe-khach-tu-ha-noi-di-da-nang-124t1151.html?date=21-11-2026",
    });
    expect(twelve).toMatchObject({
      id: "12go",
      prefilled: "route",
      note: "date-on-site",
      href: "https://12go.asia/en/bus/hanoi/da-nang",
    });
  });

  it("prefills Baolau trains with the date in the path and leaves the railway site as a search page", () => {
    const [dsvn, baolau, twelve] = travelCards({ mode: "train", from: "ha-noi", to: "hue", date });
    expect(dsvn).toMatchObject({ id: "dsvn", prefilled: "none", href: "https://dsvn.vn/" });
    expect(baolau).toMatchObject({
      id: "baolau",
      prefilled: "route-date",
      href: "https://www.baolau.com/en/s/hanoi/hue/train/2026-11-21",
    });
    expect(twelve.href).toBe("https://12go.asia/en/train/hanoi/hue");
  });

  it("does not invent a railway station for cities off the main line", () => {
    const cards = travelCards({ mode: "train", from: "ha-noi", to: "da-lat", date });
    expect(cards.find((card) => card.id === "baolau")).toMatchObject({
      prefilled: "none",
      note: "no-rail",
      href: "https://www.baolau.com/en/",
    });
  });

  it("prefills Google Flights and sends the airlines to their own search pages", () => {
    const cards = travelCards({ mode: "flight", from: "ha-noi", to: "da-nang", date });
    expect(cards.find((card) => card.id === "vietnam-airlines")?.prefilled).toBe("none");
    expect(cards.find((card) => card.id === "vietjet")?.href).toBe("https://www.vietjetair.com/en");
    expect(cards.find((card) => card.id === "bamboo")?.href).toBe("https://www.bambooairways.com/vn/en");
    const google = cards.find((card) => card.id === "google-flights");
    expect(google?.prefilled).toBe("route-date");
    expect(google?.href).toContain("Flights%20from%20HAN%20to%20DAD%20on%202026-11-21%20one%20way");
  });

  it("names the nearest airport when the city has none of its own", () => {
    const google = travelCards({ mode: "flight", from: "hoi-an", to: "phu-quoc", date }).find(
      (card) => card.id === "google-flights",
    );
    expect(google).toMatchObject({
      prefilled: "route-date",
      iataFrom: "DAD",
      iataTo: "PQC",
      nearest: [{ city: "hoi-an", via: "da-nang", iata: "DAD" }],
      note: "airports",
    });
    expect(google?.href).toContain("DAD%20to%20PQC");
  });

  it("opens taxi apps without a pickup", () => {
    const cards = travelCards({ mode: "taxi", from: "ha-noi", to: "hue", date });
    expect(cards.map((card) => card.id)).toEqual(["grab", "xanh", "be"]);
    expect(cards.every((card) => card.prefilled === "none" && card.note === "no-pickup")).toBe(true);
    expect(cards[0].href).toBe("https://www.grab.com/vn/transport/");
    expect(cards[1].href).toBe("https://www.xanhsm.com/");
    expect(cards[2].href).toBe("https://be.com.vn/");
  });
});

describe("vehicles deep link", () => {
  it("round-trips the page, mode, cities, and date", () => {
    const href = buildVehiclesLink({ mode: "train", from: "hue", to: "other", date: "2026-12-01" });
    expect(href).toBe("?page=vehicles&mode=train&from=hue&to=other&date=2026-12-01");
    expect(parseVehiclesLink(href)).toEqual({ mode: "train", from: "hue", to: "other", date: "2026-12-01" });
  });

  it("ignores the map page and falls back on unknown values", () => {
    expect(parseVehiclesLink("?city=hue")).toBeNull();
    expect(parseVehiclesLink("?page=vehicles&mode=boat&from=paris&date=yesterday")).toEqual({
      mode: "bus",
      from: "ha-noi",
      to: "da-nang",
      date: null,
    });
  });
});

describe("bus route query", () => {
  it("asks Overpass for a capped set of route=bus relations", () => {
    const query = buildBusRouteQuery([16.4, 107.5, 16.55, 107.65], 15);
    expect(query).toContain('relation["route"="bus"](16.4,107.5,16.55,107.65);');
    expect(query).toContain("out geom 15;");
  });

  it("stitches way geometry and skips stop platforms", () => {
    const routes = busRoutesFromOverpass({
      elements: [
        {
          type: "relation",
          id: 42,
          tags: { route: "bus", ref: "1", name: "Bến xe — Chợ", from: "Bến xe", to: "Chợ", colour: "#c00" },
          members: [
            { role: "platform", geometry: [{ lat: 16.4, lon: 107.5 }] },
            {
              role: "",
              geometry: [
                { lat: 16.46, lon: 107.58 },
                { lat: 16.47, lon: 107.59 },
              ],
            },
          ],
        },
      ],
    });
    expect(routes).toEqual([
      {
        id: "relation/42",
        ref: "1",
        name: "Bến xe — Chợ",
        from: "Bến xe",
        to: "Chợ",
        colour: "#c00",
        coordinates: [
          [107.58, 16.46],
          [107.59, 16.47],
        ],
      },
    ]);
  });
});
