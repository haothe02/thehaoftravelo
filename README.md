# theHaofTravelo

A free, personal map for wandering eleven cities in Vietnam. No accounts, no API keys, no paid tiles. The map is [OpenFreeMap](https://openfreemap.org), the places are [OpenStreetMap](https://www.openstreetmap.org), the weather is [Open-Meteo](https://open-meteo.com), and a small Cloudflare Worker keeps the upstream calls slow and cached.

Launch cities: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Hội An, Huế, Nha Trang, Đà Lạt, Phú Quốc, Sa Pa, Hạ Long, Hà Giang.

## What you get

- A Vietnam map with each city drawn as a glowing amber outline. Choosing a city flies there and raises its boundary.
- Up to ten places in six groups: eat, homestays, hotels, shops, fuel, care. Chips show and hide them.
- Pins reload only when you tap **Search this area**, open a city, tap **Near me**, or submit a search.
- Search stays inside the city's bounding box. **Near me** asks for location only after you tap it.
- A short intro (Vietnamese and English) and today's weather.
- Place cards with hours, phone, Google Maps directions, and share (the device share sheet on a phone, copy link on a desktop). Hospitals can show a call button and a 24/7 badge.
- Open-now filter for restaurants, homestays, and hotels. Places with no hours are hidden while it is on, and the panel says so.
- Links like `/?city=hoi-an&place=node/123`.
- Light and dark, Vietnamese and English, remembered in the browser.
- A feedback note stored in Cloudflare KV.

## Layout

```
web/        React + Vite + TypeScript + Tailwind + MapLibre
worker/     Cloudflare Worker: places, search, weather, feedback
shared/     Query builder, opening hours, deep links, city copy
scripts/    One-shot boundary fetch
web/public/boundaries/   Simplified city GeoJSON, committed
```

Pages talks to the Worker through `VITE_API_BASE`. In local dev that variable stays empty and Vite proxies `/api` to Wrangler on port 8787.

## Run it locally

You need Node.js 20 or newer. No API key.

```bash
npm install
npm run dev
```

That starts both processes:

- the site at http://localhost:5173
- the Worker at http://127.0.0.1:8787

Open the site, choose Hội An or Hà Nội, and wait for the pins. The first request for an area talks to Overpass and can take a few seconds. The Worker then caches places for an hour and weather for ten minutes.

Other commands:

```bash
npm test          # query builder, opening hours, deep links
npm run typecheck
npm run lint
npm run build     # production build of the site, into web/dist
```

`npm run dev` uses a simulated KV on disk (`.wrangler/`). You do not need a Cloudflare account until you deploy.

## Deploy on the free tier

Do this once, in order. Nothing here asks for a credit card if you stay on the Workers and Pages free plans.

### 1. Cloudflare account

Create a free account at https://dash.cloudflare.com/sign-up.

### 2. Install Wrangler login on your machine

From this repo, after `npm install`:

```bash
npx wrangler login
```

A browser window asks you to approve Wrangler. That stores a token on your computer. It is not committed.

### 3. Create the KV namespace

Feedback and the "city opened" counters live in one namespace.

```bash
npx wrangler kv namespace create FEEDBACK
```

The command prints an id like `a1b2c3…`. Open `worker/wrangler.toml` and replace both placeholder ids:

```toml
[[kv_namespaces]]
binding = "FEEDBACK"
id = "the id you just got"
preview_id = "the id you just got"
```

`preview_id` is only for `wrangler dev` against the real account. Local `--local` mode ignores it. Using the same id for both is fine for this MVP. The zeros in the repo are placeholders so the public repo contains no live namespace.

### 4. Deploy the Worker

```bash
npm run deploy -w @thehaoftravelo/worker
```

Wrangler prints a URL like:

```
https://thehaoftravelo-api.<your-subdomain>.workers.dev
```

Copy it. That is the API origin. Leave off the trailing slash.

Try it:

```bash
curl "https://thehaoftravelo-api.<your-subdomain>.workers.dev/api/health"
```

### 5. Deploy the site with Cloudflare Pages

In the Cloudflare dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose this GitHub repository.
3. Set:
   - **Production branch:** `main`
   - **Root directory:** `/` (the repository root, not `web`)
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `web/dist`
4. **Environment variables** (Production and Preview):
   - `NODE_VERSION` = `22`
   - `VITE_API_BASE` = the Worker URL from step 4, with no trailing slash
   - `VITE_CF_BEACON_TOKEN` = optional. Leave it empty to ship without analytics.
5. Save and deploy.

Vite reads `VITE_*` variables at **build** time. If you change `VITE_API_BASE` later, trigger a new Pages deployment.

The intended production hostname is `thehaoftravelo.pages.dev`. The Worker already allows that origin, `*.thehaoftravelo.pages.dev` preview URLs, and localhost. To use another hostname, add it to `ALLOWED_ORIGINS` in `worker/wrangler.toml` and deploy the Worker again.

### 6. Optional: Cloudflare Web Analytics

In the dashboard, **Analytics & logs → Web Analytics → Add a site**. Copy the token (not a secret API key). Set `VITE_CF_BEACON_TOKEN` on Pages and redeploy. If the variable is missing, the page does not load the beacon.

City-open counts are separate. Each time a city is opened, the browser posts once per tab session to `POST /api/events`, and the Worker increments `counter:city_opened:<city>` in KV.

## Fair use

The Worker is the only thing that calls Overpass and Nominatim.

- Places are cached for 1 hour, weather and search for 10 minutes (Cache API).
- Upstream calls are spaced about one second apart inside each Worker isolate.
- A browser is also limited to a few dozen requests a minute; extra requests get HTTP 429.
- Nominatim is called with `User-Agent: theHaofTravelo/0.1 (thehaoftravelo.pages.dev)` and `Referer: https://thehaoftravelo.pages.dev`.
- Place queries refuse a box larger than about one degree. Zoom in, then search.
- The map does not refetch when you pan. **Search this area** is an explicit click.
- Overpass is tried on `overpass-api.de`, then `maps.mail.ru`, then `overpass.openstreetmap.fr` if the first is busy.

Shops are the five useful kinds (convenience, supermarket, marketplace, gift, clothes), not every `shop=*` in the city. Each category returns at most ten places.

## City boundaries

The outlines are static GeoJSON in `web/public/boundaries/`, simplified with Turf. They are OpenStreetMap data under the ODbL. The choices below are also on each feature as `note`, and in `shared/src/cityBounds.ts`.

Vietnam's 2025 reform merged many districts into larger cities, and OSM followed. A few "cities" on this map are the place a traveller means, not the new megacity polygon.

| City | OSM source | Why |
| --- | --- | --- |
| Hà Nội | relation/1903516, current municipality | Still the Hà Nội people know, including the outer districts. |
| TP. Hồ Chí Minh | relation/19267904, historic "Thành phố Hồ Chí Minh cũ" | The live admin relation is the post-merger city and its ring currently spikes south to about 8.3°N. |
| Đà Nẵng | relation/19297407, historic "Thành phố Đà Nẵng cũ" | The live city now includes former Quảng Nam and would swallow Hội An. |
| Hội An | relation/7062047, historic city | The only current admin piece is Phường Hội An, basically the old-town ward. The former city includes the coast. |
| Huế | union of Phú Xuân, Thuận Hóa, Vỹ Dạ, An Cựu, Hương An | There is no single former-city relation. The live "Thành phố Huế" is the whole old province. Kim Long and Thủy Xuân were left out because those wards run into the southern hills. |
| Nha Trang | relation/7081538, historic city | The current ward is only a slice of the beach. |
| Đà Lạt | relation/19394120, historic city | No city-level admin relation after the commune mergers. |
| Phú Quốc | relation/12033833, the island | The historic city polygon includes far southern islets. The island coastline is the shape you fly over. |
| Sa Pa | relation/7097141, historic thị xã | The current ward is only the town core. The old town boundary includes the nearby terraces. |
| Hạ Long | union of Tuần Châu, Việt Hưng, Bãi Cháy, Cao Xanh, Hồng Gai, Hạ Long, Hà Tu, Hà Lầm | OSM no longer has one relation for the old city. Inland Hoành Bồ and Cẩm Phả are not included. |
| Hà Giang | relation/7098009, historic city | The town, not the old province (now part of Tuyên Quang). The loop starts here. |

### Regenerate the outlines

This hits Nominatim about once a second. Do not put it in CI.

```bash
npm run boundaries
```

The script reads `scripts/boundaries.json`, writes `web/public/boundaries/<id>.geojson` and `cities.geojson`, and rewrites `shared/src/cityBounds.ts`. Commit the result. Intro copy and camera centers stay in `shared/src/cities.ts` for a human to edit.

## Data attribution

- **© OpenStreetMap contributors**, data under the [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). The city outlines and the pins are OSM data. Keep this credit visible if you share or adapt the map.
- **OpenFreeMap** serves the vector tiles and styles (`liberty` in the light theme, `dark` in the dark theme). No key. Their [usage policy](https://openfreemap.org) asks you to keep the tile attribution, which the map control does.
- **Open-Meteo** provides the forecast with no key. Credit them if you keep the weather card. See https://open-meteo.com/en/terms.
- **Nominatim** and the **Overpass API** are used only from the Worker, within their published fair-use rules.
- Fonts: Fraunces and Be Vietnam Pro, loaded from Google Fonts (SIL Open Font License).

## Not in this version

Accounts, ratings, Google APIs, offline mode, and per-city marketing pages are intentionally absent. Directions open a normal Google Maps link in a new tab. That is a link, not an API.

The intro paragraphs are placeholder copy for Huy to rewrite. They live in `shared/src/cities.ts`.

## Known gaps

- The KV ids in `wrangler.toml` are placeholders until you create a namespace.
- Web Analytics stays off until `VITE_CF_BEACON_TOKEN` is set at build time.
- Public Overpass servers sometimes time out or answer 429. The Worker tries a second and third endpoint, then the site shows a retry message.
- Opening hours only exist where someone tagged them. The open-now filter says so.
- Huế and Hạ Long are unions of wards, not one historical relation.
- Shop pins are a short list of shop types, capped at ten.
