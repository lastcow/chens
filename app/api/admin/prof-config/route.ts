import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = () => `${process.env.CHENS_API_URL}/api/admin/prof-config`;
const headers = (session: { user: { id: string; role?: string } }) => ({
  "x-api-key": process.env.CHENS_API_SECRET_KEY!,
  "x-user-id": session.user.id,
  "x-user-role": (session.user as { role?: string }).role ?? "USER",
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(API(), { headers: headers(session as any), cache: "no-store" });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(API(), {
    method: "PATCH",
    headers: { ...headers(session as any), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
