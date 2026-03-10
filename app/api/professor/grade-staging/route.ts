import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API = () => `${process.env.CHENS_API_URL}/api/professor/grade-staging`;
const hdrs = (id: string) => ({
  "x-api-key": process.env.CHENS_API_SECRET_KEY!,
  "x-user-id": id,
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestId = req.nextUrl.searchParams.get("request_id");
  const url = `${API()}${requestId ? `?request_id=${requestId}` : ""}`;
  const res = await fetch(url, { headers: hdrs(session.user.id), cache: "no-store" });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(API(), {
    method: "PATCH",
    headers: { ...hdrs(session.user.id), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(API(), {
    method: "POST",
    headers: { ...hdrs(session.user.id), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
