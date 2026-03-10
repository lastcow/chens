import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${process.env.CHENS_API_URL}/api/user/profile`, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Profile service unavailable" }, { status: 502 });
  }
  return NextResponse.json(data, { status: res.status });
}
