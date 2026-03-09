import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id?: string })?.id ?? "";
    if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

    const { stripeSessionId } = await req.json();
    if (!stripeSessionId) return NextResponse.json({ error: "Missing stripeSessionId" }, { status: 400 });

    const res = await fetch(`${API_BASE}/api/user/checkout/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ stripeSessionId, userId }),
    });
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
