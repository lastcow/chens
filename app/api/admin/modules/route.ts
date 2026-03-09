import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await fetch(`${API_BASE}/api/admin/modules`, {
    headers: { "x-api-key": API_KEY, "x-user-role": "ADMIN" },
  });
  return NextResponse.json(await res.json());
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/admin/modules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "x-user-role": "ADMIN" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
