import { autocomplete, mapsEnabled } from "@/lib/google";

// Server proxy for address suggestions, so the Google key never reaches the browser.
// Returns { enabled: false } when no key is set; the form then works as plain text.

export async function GET(request: Request) {
  if (!mapsEnabled()) return Response.json({ enabled: false, suggestions: [] });

  // Only our own pages may use this proxy (browsers send Sec-Fetch-Site).
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return Response.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const s = url.searchParams.get("s") ?? undefined;
  if (q.length < 3 || q.length > 120) return Response.json({ enabled: true, suggestions: [] });
  const token = s && /^[\w-]{8,64}$/.test(s) ? s : undefined;

  const suggestions = await autocomplete(q, token);
  if (suggestions === null) return Response.json({ enabled: true, error: "unavailable", suggestions: [] });
  return Response.json(
    { enabled: true, suggestions: suggestions.slice(0, 5) },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
