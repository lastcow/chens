import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AGENT_URL = process.env.CHENS_AGENT_URL!;
const AGENT_KEY = process.env.CHENS_AGENT_KEY!;
const API_URL   = process.env.CHENS_API_URL!;
const API_KEY   = process.env.CHENS_API_SECRET_KEY!;

async function getUserCanvasToken(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/user/canvas-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.token ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Fetch user's decrypted Canvas token
  const canvasToken = await getUserCanvasToken(session.user.id);
  if (!canvasToken) {
    return NextResponse.json(
      { error: "No Canvas token found. Please add your Canvas API token in the settings above." },
      { status: 400 }
    );
  }

  const res = await fetch(`${AGENT_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": AGENT_KEY },
    body: JSON.stringify({ ...body, canvasToken, createdBy: session.user.id }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error || "Agent unavailable. Please try again shortly." },
      { status: res.status }
    );
  }

  return NextResponse.json(await res.json(), { status: 202 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${AGENT_URL}/tasks`, { headers: { "x-api-key": AGENT_KEY } });
  return NextResponse.json(await res.json());
}
