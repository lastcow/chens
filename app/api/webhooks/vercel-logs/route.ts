import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://apidev.chen.me";

// Vercel log drain verification (GET)
export async function GET(req: NextRequest) {
  const verifyToken = req.headers.get("x-vercel-verify");
  if (verifyToken) {
    return new NextResponse(verifyToken, {
      status: 200,
      headers: { "x-vercel-verify": verifyToken, "content-type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: true });
}

// Forward POST to chens-api
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers: Record<string, string> = { "content-type": "application/json" };
  const drainToken = req.headers.get("x-vercel-log-drain-token");
  if (drainToken) headers["x-vercel-log-drain-token"] = drainToken;
  const res = await fetch(`${API_BASE}/api/webhooks/vercel-logs`, {
    method: "POST", headers, body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
