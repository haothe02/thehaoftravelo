import { isCityId, type CityId } from "./cities.ts";
import { isIsoDate, type TravelMode, type TravelPlace } from "./vehiclesLink.ts";

export type Prefill = "route-date" | "route" | "none";

export type CardNote =
  | "date-on-site"
  | "link-only"
  | "no-pickup"
  | "same-place"
  | "other-city"
  | "no-rail"
  | "airports";

export type TravelCard = {
  id: string;
  href: string;
  prefilled: Prefill;
  note: CardNote | null;
  /** IATA codes actually used, when a flight link can name them. */
  iataFrom?: string;
  iataTo?: string;
  /** Launch cities that fly from another city's airport. */
  nearest?: { city: CityId; via: CityId; iata: string }[];
  vanDon?: boolean;
};

type Airport = {
  iata: string;
  /** Another launch city that actually has this airport. */
  via: CityId | null;
  /** Vân Đồn serves Hạ Long but is not one of the launch cities. */
  vanDon?: boolean;
};

const AIRPORTS: Record<CityId, Airport> = {
  "ha-noi": { iata: "HAN", via: null },
  "ho-chi-minh": { iata: "SGN", via: null },
  "da-nang": { iata: "DAD", via: null },
  "hoi-an": { iata: "DAD", via: "da-nang" },
  hue: { iata: "HUI", via: null },
  "nha-trang": { iata: "CXR", via: null },
  "da-lat": { iata: "DLI", via: null },
  "phu-quoc": { iata: "PQC", via: null },
  "sa-pa": { iata: "HAN", via: "ha-noi" },
  "ha-long": { iata: "VDO", via: null, vanDon: true },
  "ha-giang": { iata: "HAN", via: "ha-noi" },
};

/** Cities with a station on the North–South railway. */
const RAIL_CITIES = new Set<CityId>(["ha-noi", "hue", "da-nang", "nha-trang", "ho-chi-minh"]);

/**
 * Vexere area tokens, taken from live route URLs.
 * The origin token is type+id; the destination token is that same number plus a trailing 1.
 */
const VEXERE: Record<CityId, { slug: string; from: string; to: string }> = {
  "ha-noi": { slug: "ha-noi", from: "124", to: "1241" },
  "ho-chi-minh": { slug: "sai-gon", from: "129", to: "1291" },
  "da-nang": { slug: "da-nang", from: "115", to: "1151" },
  "hoi-an": { slug: "hoi-an-quang-nam", from: "2522", to: "25221" },
  hue: { slug: "hue-thua-thien-hue", from: "2647", to: "26471" },
  "nha-trang": { slug: "nha-trang-khanh-hoa", from: "2359", to: "23591" },
  "da-lat": { slug: "da-lat-lam-dong", from: "2399", to: "23991" },
  "phu-quoc": { slug: "phu-quoc-kien-giang", from: "2373", to: "23731" },
  "sa-pa": { slug: "sa-pa-lao-cai", from: "2424", to: "24241" },
  "ha-long": { slug: "ha-long-quang-ninh", from: "2554", to: "25541" },
  "ha-giang": { slug: "ha-giang", from: "122", to: "1221" },
};

const TWELVE_GO: Record<CityId, string> = {
  "ha-noi": "hanoi",
  "ho-chi-minh": "ho-chi-minh-city",
  hue: "hue",
  "da-nang": "da-nang",
  "hoi-an": "hoi-an",
  "nha-trang": "nha-trang",
  "da-lat": "da-lat",
  "phu-quoc": "phu-quoc",
  "sa-pa": "sapa",
  "ha-long": "ha-long",
  "ha-giang": "ha-giang",
};

/** Baolau place slugs that resolve to a train results page. */
const BAOLAU: Partial<Record<CityId, string>> = {
  "ha-noi": "hanoi",
  hue: "hue",
  "da-nang": "da-nang",
  "nha-trang": "nha-trang",
  "ho-chi-minh": "ho-chi-minh",
};

const BUS_INFO: Partial<Record<CityId, string>> = {
  "ha-noi": "https://timbus.vn/",
  "ho-chi-minh": "https://buyttphcm.com.vn/",
  "da-nang": "https://ecobus.danang.gov.vn/",
};

const VEXERE_HOME = "https://vexere.com/";
const TWELVE_GO_HOME = "https://12go.asia/en";
const BAOLAU_HOME = "https://www.baolau.com/en/";
const DSVN_HOME = "https://dsvn.vn/";
const VIETNAM_AIRLINES = "https://www.vietnamairlines.com/vn/en/home";
const VIETJET = "https://www.vietjetair.com/en";
const BAMBOO = "https://www.bambooairways.com/vn/en";

export function busInfoUrl(city: CityId): string | null {
  return BUS_INFO[city] ?? null;
}

export function travelCards(input: {
  mode: TravelMode;
  from: TravelPlace;
  to: TravelPlace;
  date: string;
}): TravelCard[] {
  if (input.mode === "bus") return [];
  if (input.mode === "taxi") return taxiCards();
  if (input.mode === "coach") return [vexereCard(input.from, input.to, input.date), twelveGoCard("bus", input.from, input.to)];
  if (input.mode === "train") return [dsvnCard(), baolauCard(input.from, input.to, input.date), twelveGoCard("train", input.from, input.to)];
  return flightCards(input.from, input.to, input.date);
}

function taxiCards(): TravelCard[] {
  return [
    { id: "grab", href: "https://www.grab.com/vn/transport/", prefilled: "none", note: "no-pickup" },
    { id: "xanh", href: "https://www.xanhsm.com/", prefilled: "none", note: "no-pickup" },
    { id: "be", href: "https://be.com.vn/", prefilled: "none", note: "no-pickup" },
  ];
}

function pairProblem(from: TravelPlace, to: TravelPlace): CardNote | null {
  if (from === "other" || to === "other") return "other-city";
  if (from === to) return "same-place";
  return null;
}

function vexereCard(from: TravelPlace, to: TravelPlace, date: string): TravelCard {
  const problem = pairProblem(from, to);
  const iso = isIsoDate(date) ? date : null;
  if (problem || !iso || !isCityId(from) || !isCityId(to)) {
    return { id: "vexere", href: VEXERE_HOME, prefilled: "none", note: problem ?? "link-only" };
  }
  const origin = VEXERE[from];
  const destination = VEXERE[to];
  const [year, month, day] = iso.split("-");
  const href = `https://vexere.com/vi-VN/ve-xe-khach-tu-${origin.slug}-di-${destination.slug}-${origin.from}t${destination.to}.html?date=${day}-${month}-${year}`;
  return { id: "vexere", href, prefilled: "route-date", note: null };
}

function twelveGoCard(kind: "bus" | "train", from: TravelPlace, to: TravelPlace): TravelCard {
  const problem = pairProblem(from, to);
  const home = kind === "train" ? "https://12go.asia/en/trains-in-vietnam" : TWELVE_GO_HOME;
  if (problem || !isCityId(from) || !isCityId(to)) {
    return { id: "12go", href: home, prefilled: "none", note: problem ?? "link-only" };
  }
  const trainPlace = (city: CityId) => RAIL_CITIES.has(city) || city === "sa-pa";
  if (kind === "train" && (!trainPlace(from) || !trainPlace(to))) {
    return { id: "12go", href: home, prefilled: "none", note: "no-rail" };
  }
  const href = `https://12go.asia/en/${kind}/${TWELVE_GO[from]}/${TWELVE_GO[to]}`;
  return { id: "12go", href, prefilled: "route", note: "date-on-site" };
}

function dsvnCard(): TravelCard {
  return { id: "dsvn", href: DSVN_HOME, prefilled: "none", note: "link-only" };
}

function baolauCard(from: TravelPlace, to: TravelPlace, date: string): TravelCard {
  const problem = pairProblem(from, to);
  const iso = isIsoDate(date) ? date : null;
  if (problem || !iso || !isCityId(from) || !isCityId(to)) {
    return { id: "baolau", href: BAOLAU_HOME, prefilled: "none", note: problem ?? "link-only" };
  }
  const origin = BAOLAU[from];
  const destination = BAOLAU[to];
  if (!origin || !destination) {
    return { id: "baolau", href: BAOLAU_HOME, prefilled: "none", note: "no-rail" };
  }
  return {
    id: "baolau",
    href: `https://www.baolau.com/en/s/${origin}/${destination}/train/${iso}`,
    prefilled: "route-date",
    note: null,
  };
}

function flightCards(from: TravelPlace, to: TravelPlace, date: string): TravelCard[] {
  const problem = pairProblem(from, to);
  const guidance = isCityId(from) && isCityId(to) ? airportGuidance(from, to) : null;
  const airlineNote = problem ?? guidance?.note ?? "link-only";
  const airlines: TravelCard[] = [
    { id: "vietnam-airlines", href: VIETNAM_AIRLINES, prefilled: "none", ...guidance, note: airlineNote },
    { id: "vietjet", href: VIETJET, prefilled: "none", ...guidance, note: airlineNote },
    { id: "bamboo", href: BAMBOO, prefilled: "none", ...guidance, note: airlineNote },
  ];
  return [...airlines, googleFlightsCard(date, problem, guidance)];
}

function airportGuidance(from: CityId, to: CityId): Pick<TravelCard, "note" | "nearest" | "vanDon" | "iataFrom" | "iataTo"> {
  const origin = AIRPORTS[from];
  const destination = AIRPORTS[to];
  const nearest = [from, to].flatMap((city) => {
    const via = AIRPORTS[city].via;
    return via ? [{ city, via, iata: AIRPORTS[city].iata }] : [];
  });
  const vanDon = Boolean(origin.vanDon || destination.vanDon);
  const same = origin.iata === destination.iata;
  return {
    note: nearest.length || vanDon || same ? "airports" : null,
    nearest,
    vanDon,
    iataFrom: origin.iata,
    iataTo: destination.iata,
  };
}

function googleFlightsCard(
  date: string,
  problem: CardNote | null,
  guidance: Pick<TravelCard, "note" | "nearest" | "vanDon" | "iataFrom" | "iataTo"> | null,
): TravelCard {
  const home = "https://www.google.com/travel/flights?hl=en&curr=VND";
  const iso = isIsoDate(date) ? date : null;
  if (problem || !iso || !guidance?.iataFrom || !guidance.iataTo || guidance.iataFrom === guidance.iataTo) {
    return {
      id: "google-flights",
      href: home,
      prefilled: "none",
      ...guidance,
      note: problem ?? guidance?.note ?? "link-only",
    };
  }
  const query = `Flights from ${guidance.iataFrom} to ${guidance.iataTo} on ${iso} one way`;
  const href = `https://www.google.com/travel/flights?hl=en&curr=VND&q=${encodeURIComponent(query)}`;
  return {
    id: "google-flights",
    href,
    prefilled: "route-date",
    note: guidance.note,
    nearest: guidance.nearest,
    vanDon: guidance.vanDon,
    iataFrom: guidance.iataFrom,
    iataTo: guidance.iataTo,
  };
}
