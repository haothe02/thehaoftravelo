import {
  bboxSpanTooLarge,
  isInsideVietnam,
  normalizeBBox,
  parseBBox,
  pointInsideBBox,
  type BBox,
} from "../../shared/src/bbox.ts";
import { isCityId } from "../../shared/src/cities.ts";
import { buildOverpassQuery, parseCategoryList, type OverpassResponse } from "../../shared/src/overpass.ts";
import {
  placesFromNominatim,
  placesFromOverpass,
  type NominatimItem,
  type Place,
} from "../../shared/src/places.ts";
import { withCors } from "./cors.ts";
import type { Env } from "./env.ts";
import { clientIp, error, json, rateLimit } from "./http.ts";
import { cached, fetchNominatim, fetchOverpass, fetchWeather } from "./upstream.ts";

const ATTRIBUTION = "© OpenStreetMap contributors, ODbL";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request, env);
    }
    const url = new URL(request.url);
    try {
      const response = await route(request, env, url);
      return withCors(response, request, env);
    } catch (cause) {
      console.error(cause);
      return withCors(error("upstream", "The map data service is busy. Try again in a moment.", 502), request, env);
    }
  },
};

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;
  if (request.method === "GET" && pathname === "/api/health") {
    return json({ ok: true, service: "thehaoftravelo" });
  }
  if (request.method === "GET" && pathname === "/api/places") {
    return places(request, url);
  }
  if (request.method === "GET" && pathname === "/api/search") {
    return search(request, url);
  }
  if (request.method === "GET" && pathname === "/api/weather") {
    return weather(request, url);
  }
  if (request.method === "POST" && pathname === "/api/feedback") {
    return feedback(request, env);
  }
  if (request.method === "POST" && pathname === "/api/events") {
    return events(request, env);
  }
  return error("not_found", "Unknown endpoint.", 404);
}

async function places(request: Request, url: URL): Promise<Response> {
  if (rateLimit(clientIp(request), 30)) {
    return error("rate_limited", "Too many map requests. Wait a minute and try again.", 429);
  }
  const id = url.searchParams.get("id");
  if (id) return placeById(id);

  const bbox = parseBBox(url.searchParams.get("bbox"));
  if (!bbox) return error("bad_bbox", "bbox must be south,west,north,east.", 400);
  if (!isInsideVietnam(bbox)) {
    return error("outside_vietnam", "This explorer only loads places inside Vietnam.", 400);
  }
  if (bboxSpanTooLarge(bbox)) {
    return error("bbox_too_large", "Zoom in a little, then search this area.", 400);
  }
  const categories = parseCategoryList(url.searchParams.get("categories"));
  if (!categories) return error("bad_categories", "Pick one or more known categories.", 400);

  const normalized = normalizeBBox(bbox);
  const query = buildOverpassQuery(normalized, categories);
  const cacheUrl = `https://cache.thehaoftravelo.internal/places?bbox=${normalized.join(",")}&categories=${categories.join(",")}`;
  return cached(cacheUrl, 60 * 60, async () => {
    const payload = (await fetchOverpass(query)) as OverpassResponse;
    if (payload.remark && !payload.elements) {
      return error("upstream", "Place search did not finish. Try a smaller area.", 502);
    }
    const found = placesFromOverpass(payload);
    return json({ places: found, attribution: ATTRIBUTION });
  });
}

async function placeById(id: string): Promise<Response> {
  const match = /^(node|way)\/(\d+)$/.exec(id);
  if (!match) return error("bad_place", "place id must look like node/123 or way/123.", 400);
  const [, type, numeric] = match;
  const cacheUrl = `https://cache.thehaoftravelo.internal/place?id=${type}/${numeric}`;
  return cached(cacheUrl, 60 * 60, async () => {
    const statement = type === "node" ? `node(${numeric}); out tags;` : `way(${numeric}); out center tags;`;
    const payload = (await fetchOverpass(`[out:json][timeout:20];${statement}`)) as OverpassResponse;
    const found = placesFromOverpass(payload);
    if (!found[0]) return error("not_found", "That place is not in the categories this map shows.", 404);
    return json({ place: found[0], attribution: ATTRIBUTION });
  });
}

async function search(request: Request, url: URL): Promise<Response> {
  if (rateLimit(clientIp(request), 20)) {
    return error("rate_limited", "Too many searches. Wait a minute and try again.", 429);
  }
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2 || q.length > 80) {
    return error("bad_query", "Search needs between 2 and 80 characters.", 400);
  }
  const bbox = parseBBox(url.searchParams.get("bbox"));
  if (!bbox) return error("bad_bbox", "bbox must be south,west,north,east.", 400);
  if (!isInsideVietnam(bbox)) {
    return error("outside_vietnam", "Search stays inside Vietnam.", 400);
  }
  const [south, west, north, east] = bbox;
  const nominatim = new URL("https://nominatim.openstreetmap.org/search");
  nominatim.searchParams.set("format", "jsonv2");
  nominatim.searchParams.set("q", q);
  nominatim.searchParams.set("limit", "10");
  nominatim.searchParams.set("countrycodes", "vn");
  nominatim.searchParams.set("viewbox", `${west},${north},${east},${south}`);
  nominatim.searchParams.set("bounded", "1");
  nominatim.searchParams.set("addressdetails", "0");
  const cacheUrl = `https://cache.thehaoftravelo.internal/search?q=${encodeURIComponent(q.toLowerCase())}&bbox=${bbox.join(",")}`;
  return cached(cacheUrl, 10 * 60, async () => {
    const payload = (await fetchNominatim(nominatim)) as NominatimItem[];
    const places = placesFromNominatim(Array.isArray(payload) ? payload : []).filter((place) =>
      pointInsideBBox(place.lat, place.lng, bbox as BBox),
    );
    return json({ places, attribution: ATTRIBUTION });
  });
}

async function weather(request: Request, url: URL): Promise<Response> {
  if (rateLimit(clientIp(request), 30)) {
    return error("rate_limited", "Too many weather requests. Wait a minute.", 429);
  }
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return error("bad_point", "lat and lng are required.", 400);
  }
  if (!pointInsideBBox(lat, lng, [7.5, 102, 23.8, 110.5])) {
    return error("outside_vietnam", "Weather is limited to Vietnam.", 400);
  }
  const cacheUrl = `https://cache.thehaoftravelo.internal/weather?lat=${lat.toFixed(2)}&lng=${lng.toFixed(2)}`;
  return cached(cacheUrl, 10 * 60, async () => {
    const payload = (await fetchWeather(lat, lng)) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    return json({
      temperature: payload.current?.temperature_2m ?? null,
      weatherCode: payload.current?.weather_code ?? null,
      high: payload.daily?.temperature_2m_max?.[0] ?? null,
      low: payload.daily?.temperature_2m_min?.[0] ?? null,
      attribution: "Weather data by Open-Meteo.com",
    });
  });
}

async function feedback(request: Request, env: Env): Promise<Response> {
  if (rateLimit(`feedback:${clientIp(request)}`, 5)) {
    return error("rate_limited", "Thanks — give it a few minutes before sending another note.", 429);
  }
  const body = await readJson(request);
  if (!body) return error("bad_json", "Send a JSON body.", 400);
  const message = stringField(body.message, 2000);
  if (!message || message.length < 2) {
    return error("bad_message", "Write a short note (at least a few words).", 400);
  }
  const contact = stringField(body.contact, 200) || undefined;
  const context = contextField(body.context);
  if (!env.FEEDBACK) return error("storage", "Feedback storage is not configured.", 503);
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  await env.FEEDBACK.put(
    `feedback:${id}`,
    JSON.stringify({
      id,
      message,
      contact,
      context,
      createdAt: new Date().toISOString(),
    }),
  );
  return json({ ok: true }, 201);
}

async function events(request: Request, env: Env): Promise<Response> {
  if (rateLimit(`events:${clientIp(request)}`, 40)) {
    return json({ ok: true, dropped: true });
  }
  const body = await readJson(request);
  if (!body) return error("bad_json", "Send a JSON body.", 400);
  if (body.name !== "city_opened") return error("bad_event", "Unknown event.", 400);
  const city = typeof body.city === "string" ? body.city : "";
  if (!isCityId(city)) return error("bad_city", "Unknown city.", 400);
  if (env.FEEDBACK) {
    const key = `counter:city_opened:${city}`;
    const current = Number((await env.FEEDBACK.get(key)) || "0");
    const next = Number.isFinite(current) ? current + 1 : 1;
    await env.FEEDBACK.put(key, String(next));
  }
  console.log(JSON.stringify({ event: "city_opened", city }));
  return json({ ok: true });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > 8_000) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function stringField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function contextField(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const city = typeof source.city === "string" && isCityId(source.city) ? source.city : null;
  const place = typeof source.place === "string" && /^(node|way|relation)\/\d+$/.test(source.place) ? source.place : null;
  const num = (input: unknown) => (typeof input === "number" && Number.isFinite(input) ? input : null);
  return {
    city,
    place,
    lat: num(source.lat),
    lng: num(source.lng),
    zoom: num(source.zoom),
    lang: source.lang === "vi" || source.lang === "en" ? source.lang : null,
    theme: source.theme === "dark" || source.theme === "light" ? source.theme : null,
  };
}

export type { Place };
