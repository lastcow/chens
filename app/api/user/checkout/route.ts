import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // id is set in auth.ts session callback from token.id (DB user ID)
  const user = session.user as { id?: string; role?: string };
  const userId = user?.id ?? "";
  const userEmail = session.user?.email ?? "";

  if (!userId) {
    console.error("[checkout] userId empty — session.user:", JSON.stringify(session.user));
    return NextResponse.json({ error: "Could not resolve user ID from session" }, { status: 400 });
  }

  const body = await req.json();

  try {
    const res = await fetch(`${API_BASE}/api/user/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ ...body, userId, userEmail }),
    });

    const text = await res.text();
    console.log("[checkout proxy] status:", res.status, "body:", text.slice(0, 200));

    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || "Empty response from API" }; }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("[checkout proxy] fetch error:", err);
    return NextResponse.json({ error: "Failed to reach payment API: " + String(err) }, { status: 502 });
  }
}
