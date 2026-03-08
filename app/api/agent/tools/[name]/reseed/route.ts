import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AGENT_URL = process.env.CHENS_AGENT_URL!;
const AGENT_KEY = process.env.CHENS_AGENT_KEY!;

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const res = await fetch(`${AGENT_URL}/tools/${name}/reseed`, {
    method: "POST",
    headers: { "x-api-key": AGENT_KEY },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
