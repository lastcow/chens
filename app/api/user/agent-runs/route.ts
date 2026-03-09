import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = req.nextUrl.searchParams.get("page") ?? "1";
  const res = await fetch(`${process.env.CHENS_API_URL}/api/user/agent-runs?page=${page}`, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
