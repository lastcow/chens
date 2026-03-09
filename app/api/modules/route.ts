import { NextResponse } from "next/server";
const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;
export async function GET() {
  const res = await fetch(`${API_BASE}/api/modules`, { headers: { "x-api-key": API_KEY }, cache: "no-store" });
  return NextResponse.json(await res.json());
}
