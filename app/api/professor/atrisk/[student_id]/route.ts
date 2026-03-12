import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { student_id } = await params;
  const searchParams = req.nextUrl.searchParams;
  
  const API_BASE = process.env.CHENS_API_URL;
  const API_KEY = process.env.CHENS_API_SECRET_KEY;
  
  if (!API_BASE || !API_KEY) {
    return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
  }
  
  try {
    const res = await fetch(
      `${API_BASE}/api/professor/atrisk/${student_id}?${searchParams.toString()}`,
      {
        headers: {
          "x-api-key": API_KEY,
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch student details" },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[atrisk-proxy] Error:", err);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}
