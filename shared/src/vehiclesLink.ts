import { isCityId, type CityId } from "./cities.ts";

export const TRAVEL_MODES = ["bus", "taxi", "coach", "flight", "train"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

export type TravelPlace = CityId | "other";

export type VehiclesLink = {
  mode: TravelMode;
  from: TravelPlace;
  to: TravelPlace;
  /** YYYY-MM-DD, or null when the URL omitted a usable date. */
  date: string | null;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isTravelMode(value: string | null): value is TravelMode {
  return !!value && (TRAVEL_MODES as readonly string[]).includes(value);
}

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value) return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseTravelPlace(value: string | null, fallback: TravelPlace): TravelPlace {
  if (value === "other") return "other";
  if (isCityId(value)) return value;
  return fallback;
}

export function parseVehiclesLink(search: string): VehiclesLink | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (params.get("page") !== "vehicles") return null;
  const modeRaw = params.get("mode");
  const dateRaw = params.get("date");
  return {
    mode: isTravelMode(modeRaw) ? modeRaw : "bus",
    from: parseTravelPlace(params.get("from"), "ha-noi"),
    to: parseTravelPlace(params.get("to"), "da-nang"),
    date: isIsoDate(dateRaw) ? dateRaw : null,
  };
}

/** A week ahead on the Vietnam calendar, as YYYY-MM-DD. */
export function defaultTravelDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(Date.UTC(pick("year"), pick("month") - 1, pick("day") + 7));
  return date.toISOString().slice(0, 10);
}

export function buildVehiclesLink(link: { mode: TravelMode; from: TravelPlace; to: TravelPlace; date: string }): string {
  const params = new URLSearchParams();
  params.set("page", "vehicles");
  params.set("mode", link.mode);
  params.set("from", link.from);
  params.set("to", link.to);
  if (isIsoDate(link.date)) params.set("date", link.date);
  return `?${params.toString()}`;
}
