import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.CHENS_API_URL!;
const KEY = process.env.CHENS_API_SECRET_KEY!;

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await params;
  const url = new URL(`${API}/api/msbiz/${path.join("/")}${req.nextUrl.search}`);

  const headers: Record<string, string> = {
    "x-api-key": KEY,
    "x-user-id": session.user.id,
  };

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = req.headers.get("content-type");
    if (ct) headers["content-type"] = ct;
    body = await req.arrayBuffer().then(b => Buffer.from(b));
  }

  const res = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
