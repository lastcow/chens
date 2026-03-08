import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AGENT_URL = process.env.CHENS_AGENT_URL!;
const AGENT_KEY = process.env.CHENS_AGENT_KEY!;
const API_BASE  = process.env.CHENS_API_URL!;
const API_KEY   = process.env.CHENS_API_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${AGENT_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": AGENT_KEY },
    body: JSON.stringify({ ...body, createdBy: session.user?.id }),
  });
  return NextResponse.json(await res.json(), { status: 202 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${AGENT_URL}/tasks`, {
    headers: { "x-api-key": AGENT_KEY },
  });
  return NextResponse.json(await res.json());
}
