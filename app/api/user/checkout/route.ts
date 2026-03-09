import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id ?? "";
  const userEmail = session.user?.email ?? "";

  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/user/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ ...body, userId, userEmail }),
  });
  return NextResponse.json(await res.json());
}
