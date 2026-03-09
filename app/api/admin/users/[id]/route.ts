import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiUpdateUser } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const data = await apiUpdateUser(id, body, "ADMIN");
  return NextResponse.json(data.user);
}
