import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${process.env.CHENS_API_URL}/api/user/password`, {
    method: "PATCH",
    headers: {
      "x-api-key": process.env.CHENS_API_SECRET_KEY!,
      "x-user-id": session.user.id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
