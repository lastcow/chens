import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

// GET /api/images/:preset — proxies Imagen generation from ChensAPI
// Cached for 24h so we don't regenerate on every page load
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ preset: string }> }
) {
  const { preset } = await params;

  const res = await fetch(`${API_BASE}/api/images/generate?preset=${preset}`, {
    headers: { "x-api-key": API_KEY },
    next: { revalidate: 86400 }, // cache 24h
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
