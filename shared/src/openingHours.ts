import OpeningHours from "opening_hours";
import { CATEGORIES, type CategoryId } from "./categories.ts";

export type OpenState = "open" | "closed" | "unknown";

const HOURS_CATEGORY_IDS = new Set<CategoryId>(
  CATEGORIES.filter((category) => category.hoursFilter).map((category) => category.id),
);

/**
 * opening_hours.js reads the clock through the Date's local getters.
 * Shift the instant so those getters show Asia/Ho_Chi_Minh wall time
 * even when the browser or test runner is in another timezone.
 */
export function asVietnamWallClock(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    pick("hour"),
    pick("minute"),
    pick("second"),
  );
}

export function openState(value: string | undefined, now = new Date()): OpenState {
  if (!value || !value.trim()) return "unknown";
  try {
    const hours = new OpeningHours(value);
    return hours.getState(asVietnamWallClock(now)) ? "open" : "closed";
  } catch {
    return "unknown";
  }
}

export function isAlwaysOpen(value: string | undefined): boolean {
  if (!value) return false;
  const compact = value.toLowerCase().replace(/\s+/g, "");
  return (
    compact === "24/7" ||
    compact === "open" ||
    compact === "00:00-24:00" ||
    compact === "mo-su00:00-24:00" ||
    compact === "mo-su,ph00:00-24:00"
  );
}

export function hoursFilterApplies(category: string): boolean {
  return HOURS_CATEGORY_IDS.has(category as CategoryId);
}

export function applyOpenNowFilter<T extends { category: string; opening_hours?: string }>(
  places: readonly T[],
  enabled: boolean,
  now = new Date(),
): { places: T[]; hiddenForMissingHours: number } {
  if (!enabled) return { places: [...places], hiddenForMissingHours: 0 };
  let hiddenForMissingHours = 0;
  const next = places.filter((place) => {
    if (!hoursFilterApplies(place.category)) return true;
    const state = openState(place.opening_hours, now);
    if (state === "unknown") {
      hiddenForMissingHours += 1;
      return false;
    }
    return state === "open";
  });
  return { places: next, hiddenForMissingHours };
}
