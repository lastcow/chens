import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ canvas_uid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { canvas_uid } = await params;
  const url = `${process.env.CHENS_API_URL}/api/professor/students/${canvas_uid}`;
  const res = await fetch(url, {
    headers: { "x-api-key": process.env.CHENS_API_SECRET_KEY!, "x-user-id": session.user.id },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
