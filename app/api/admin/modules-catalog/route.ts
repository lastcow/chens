import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

async function checkAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const res = await fetch(`${API_BASE}/api/admin/modules-catalog`, {
    headers: { "x-api-key": API_KEY, "x-user-role": "ADMIN" }, cache: "no-store",
  });
  return NextResponse.json(await res.json());
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/admin/modules-catalog`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "x-user-role": "ADMIN" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
