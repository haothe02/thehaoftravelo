import { isCityId, type CityId } from "./cities.ts";

const PLACE_ID = /^(node|way|relation)\/\d+$/;

export type MapLink = {
  city: CityId | null;
  place: string | null;
};

export function parseMapLink(search: string): MapLink {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const cityRaw = params.get("city");
  const placeRaw = params.get("place");
  return {
    city: isCityId(cityRaw) ? cityRaw : null,
    place: placeRaw && PLACE_ID.test(placeRaw) ? placeRaw : null,
  };
}

export function buildMapLink(city: string | null, place: string | null): string {
  const params = new URLSearchParams();
  if (city && isCityId(city)) params.set("city", city);
  if (place && PLACE_ID.test(place)) params.set("place", place);
  const query = params.toString();
  return query ? `?${query}` : "/";
}
