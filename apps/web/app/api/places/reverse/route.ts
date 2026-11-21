import { mapsEnabled, reverseGeocode } from "@/lib/google";

// "Use my location": turns the browser's coordinates into an address, server-side.

export async function GET(request: Request) {
  if (!mapsEnabled()) return Response.json({ enabled: false }, { status: 503 });
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return Response.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  // Roughly Great Britain and Northern Ireland.
  if (!(lat > 49 && lat < 61 && lng > -9 && lng < 2.5)) {
    return Response.json({ error: "outside_uk" }, { status: 400 });
  }
  const place = await reverseGeocode(Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5);
  if (!place) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(place, { headers: { "Cache-Control": "no-store" } });
}
