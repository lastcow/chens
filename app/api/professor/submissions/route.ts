import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CHENS_API_URL;
const API_KEY = process.env.CHENS_API_SECRET_KEY;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignmentId = req.nextUrl.searchParams.get("assignment_id");
  if (!assignmentId) return NextResponse.json({ error: "Missing assignment_id" }, { status: 400 });

  if (!API_BASE || !API_KEY) {
    return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/professor/submissions?assignment_id=${assignmentId}`,
      {
        headers: {
          "x-api-key": API_KEY,
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[submissions-proxy]", err);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
