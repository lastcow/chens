import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URLSearchParams();
  ["course_id", "term_id"].forEach(k => { const v = req.nextUrl.searchParams.get(k); if (v) params.set(k, v); });
  const url = `${process.env.CHENS_API_URL}/api/professor/students${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
