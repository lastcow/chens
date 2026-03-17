import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY  = process.env.CHENS_API_SECRET_KEY!;

async function proxy(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = `${API_BASE}/api/admin/merchandise${req.nextUrl.search}`;
  const headers: Record<string, string> = { "x-api-key": API_KEY, "x-user-role": "ADMIN" };
  let body: BodyInit | null = null;
  if (req.method !== "GET") {
    headers["content-type"] = "application/json";
    body = await req.text();
  }
  const res = await fetch(url, { method: req.method, headers, body, cache: "no-store" });
  const data = await res.arrayBuffer();
  return new NextResponse(data, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
}

export const GET  = proxy;
export const POST = proxy;
