import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = () => `${process.env.CHENS_API_URL}/api/user/credits`;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = req.nextUrl.searchParams.get("page") ?? "1";
  const res = await fetch(`${API()}?page=${page}`, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  let data: unknown;
  try { data = await res.json(); } catch { return NextResponse.json({ error: "Service unavailable" }, { status: 502 }); }
  return NextResponse.json(data, { status: res.status });
}
