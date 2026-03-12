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
  
  console.log(`[atrisk-proxy] Fetching from: ${API_BASE}/api/professor/atrisk/${student_id}`);
  
  if (!API_BASE || !API_KEY) {
    console.error("[atrisk-proxy] Missing env vars:", { API_BASE: !!API_BASE, API_KEY: !!API_KEY });
    return NextResponse.json(
      { error: "API configuration missing", debug: { has_api_base: !!API_BASE, has_api_key: !!API_KEY } },
      { status: 500 }
    );
  }
  
  try {
    const url = `${API_BASE}/api/professor/atrisk/${student_id}?${searchParams.toString()}`;
    console.log(`[atrisk-proxy] URL: ${url}, User: ${session.user.id}`);
    
    const res = await fetch(url, {
      headers: {
        "x-api-key": API_KEY,
        "x-user-id": session.user.id,
      },
      cache: "no-store",
    });
    
    console.log(`[atrisk-proxy] Response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[atrisk-proxy] Error response: ${errorText}`);
      return NextResponse.json(
        { error: "ChensAPI returned error", status: res.status, body: errorText },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    console.log(`[atrisk-proxy] Success, returning data for student`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[atrisk-proxy] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch student details", details: String(err) },
      { status: 500 }
    );
  }
}
