import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${process.env.CHENS_API_URL}/api/professor/courses`, {
    headers: {
      "x-api-key": process.env.API_SECRET_KEY!,
      "x-user-id": session.user.id,
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
