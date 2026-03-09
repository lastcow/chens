import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;

  const res = await fetch(`${API_BASE}/api/user/modules`, {
    headers: { "x-api-key": API_KEY, "x-user-id": userId ?? "" },
  });
  return NextResponse.json(await res.json());
}
