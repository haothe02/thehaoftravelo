import type { Place } from "@shared/places";
import { buildMapLink } from "@shared/deeplink";

export function placeTitle(place: Place, language: string, unnamed: string): string {
  if (language.startsWith("vi") && place.nameVi) return place.nameVi;
  if (language.startsWith("en") && place.nameEn) return place.nameEn;
  return place.name || unnamed;
}

export function weatherKey(code: number | null): string {
  if (code == null) return "unknown";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "mainlyClear";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "unknown";
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function shareUrl(city: string | null, place: string | null): string {
  const link = buildMapLink(city, place);
  const path = `${window.location.origin}${window.location.pathname}`;
  return link === "/" ? path : `${path}${link}`;
}

export async function sharePlace(title: string, city: string | null, placeId: string): Promise<"shared" | "copied"> {
  const url = shareUrl(city, placeId);
  const mobile = window.matchMedia("(pointer: coarse)").matches;
  if (mobile && typeof navigator.share === "function") {
    await navigator.share({ title, url });
    return "shared";
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}
