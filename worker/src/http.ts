export function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

export function error(code: string, message: string, status: number): Response {
  return json({ error: code, message }, status);
}

const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || "local";
}

export function rateLimit(ip: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

let lastUpstreamAt = 0;

/** Space upstream calls about one second apart inside this isolate. */
export async function paceUpstream(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastUpstreamAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastUpstreamAt = Date.now();
}
