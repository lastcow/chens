import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { id?: string; role?: string };
    const userId = user?.id ?? "";
    const userEmail = session.user?.email ?? "";

    if (!userId) {
      console.error("[checkout] userId empty — session.user:", JSON.stringify(session.user));
      return NextResponse.json({ error: "Could not resolve user ID from session. Please sign out and sign in again." }, { status: 400 });
    }

    const body = await req.json();
    console.log("[checkout] userId:", userId, "payload:", JSON.stringify(body));

    const res = await fetch(`${API_BASE}/api/user/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({
        ...body,
        userId,
        userEmail,
        successUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=1&sid={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard?cancelled=1`,
      }),
    });

    const text = await res.text();
    console.log("[checkout proxy] status:", res.status, "body:", text.slice(0, 300));

    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || "Empty response from payment API" }; }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });

  } catch (err) {
    console.error("[checkout] unhandled error:", err);
    return NextResponse.json({ error: "Internal error: " + String(err) }, { status: 500 });
  }
}
