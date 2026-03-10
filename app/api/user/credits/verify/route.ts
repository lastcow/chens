import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${process.env.CHENS_API_URL}/api/user/credits/verify`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.CHENS_API_SECRET_KEY!,
      "x-user-id": session.user.id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  let data: unknown;
  try { data = await res.json(); } catch { return NextResponse.json({ error: "Service unavailable" }, { status: 502 }); }
  return NextResponse.json(data, { status: res.status });
}
