import { askEnabled, extractJourney } from "@/lib/ask";

// "Just ask me" proxy. Text in, form fields out. No prices here, ever.

// Light protection for the paid API: per-IP limit, kept in memory (resets on restart).
const hits = new Map<string, number[]>();
const LIMIT = 10; // requests
const WINDOW_MS = 10 * 60_000; // per 10 minutes

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export async function POST(request: Request) {
  if (!askEnabled()) return Response.json({ enabled: false }, { status: 503 });
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return Response.json({ error: "forbidden" }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "slow_down" }, { status: 429 });

  let text = "";
  try {
    text = String(((await request.json()) as { text?: unknown }).text ?? "").trim();
  } catch {
    /* fall through */
  }
  if (text.length < 5) return Response.json({ error: "too_short" }, { status: 400 });
  if (text.length > 600) return Response.json({ error: "too_long" }, { status: 400 });

  const fields = await extractJourney(text);
  if (!fields) return Response.json({ error: "unavailable" }, { status: 502 });
  return Response.json({ fields }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  return Response.json({ enabled: askEnabled() });
}
