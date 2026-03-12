import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CHENS_API_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { student_id } = await params;
  const searchParams = req.nextUrl.searchParams;
  
  try {
    const res = await fetch(
      `${API_BASE}/api/professor/atrisk/${student_id}?${searchParams.toString()}`,
      {
        headers: {
          "x-api-key": process.env.CHENS_API_SECRET_KEY!,
          "x-user-id": session.user.id,
        },
        cache: "no-store",
      }
    );
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[atrisk-detail-proxy]", err);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}
