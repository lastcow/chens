import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const termId = req.nextUrl.searchParams.get("term_id");
  const url = `${process.env.CHENS_API_URL}/api/professor/atrisk${termId ? `?term_id=${termId}` : ""}`;
  const res = await fetch(url, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
