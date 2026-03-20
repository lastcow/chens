import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.CHENS_API_URL!;
const KEY = process.env.CHENS_API_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(`${API}/api/msbiz/price-matches/rates`);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": KEY,
      "x-user-id": session.user.id,
      "x-user-role": (session.user as { role?: string })?.role ?? "USER",
    },
    cache: "no-store",
  });

  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
