import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = () => `${process.env.CHENS_API_URL}/api/professor/assignments/publish`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(API(), {
    method: "POST",
    headers: {
      "x-api-key": process.env.CHENS_API_SECRET_KEY!,
      "x-user-id": session.user.id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
