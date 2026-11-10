export interface Env {
  FEEDBACK: KVNamespace;
  ALLOWED_ORIGINS: string;
}

export const USER_AGENT = "theHaofTravelo/0.1 (thehaoftravelo.pages.dev)";
export const REFERER = "https://thehaoftravelo.pages.dev";

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];
