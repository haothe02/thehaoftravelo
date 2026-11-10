import { OVERPASS_ENDPOINTS, REFERER, USER_AGENT } from "./env.ts";
import { paceUpstream } from "./http.ts";

export async function cached(
  cacheKey: string,
  ttlSeconds: number,
  loader: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  const key = new Request(cacheKey);
  const hit = await cache.match(key).catch(() => undefined);
  if (hit) {
    const headers = new Headers(hit.headers);
    headers.set("X-Cache", "HIT");
    return new Response(hit.body, { status: hit.status, headers });
  }
  const fresh = await loader();
  if (fresh.ok) {
    const headers = new Headers(fresh.headers);
    headers.set("Cache-Control", `public, max-age=${ttlSeconds}`);
    headers.set("X-Cache", "MISS");
    const stored = new Response(fresh.clone().body, { status: fresh.status, headers });
    await cache.put(key, stored).catch(() => undefined);
    return new Response(fresh.body, { status: fresh.status, headers });
  }
  return fresh;
}

export async function fetchOverpass(query: string): Promise<unknown> {
  let lastError = "Overpass unavailable";
  for (const endpoint of OVERPASS_ENDPOINTS) {
    await paceUpstream();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(25_000),
      });
      if (response.ok) return response.json();
      lastError = `Overpass ${response.status}`;
      if (response.status < 500 && response.status !== 406 && response.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Overpass failed";
    }
  }
  throw new Error(lastError);
}

export async function fetchNominatim(url: URL): Promise<unknown> {
  await paceUpstream();
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: REFERER,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return response.json();
}

export async function fetchWeather(lat: number, lng: number): Promise<unknown> {
  await paceUpstream();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "Asia/Ho_Chi_Minh");
  url.searchParams.set("forecast_days", "1");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  return response.json();
}
