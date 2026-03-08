import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiGetUsers, apiUpdateUser, apiDeleteUser } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const data = await apiGetUsers("ADMIN");
  return NextResponse.json(data.users);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id, role } = await req.json();
  const data = await apiUpdateUser(id, { role }, "ADMIN");
  return NextResponse.json(data.user);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await req.json();
  const data = await apiDeleteUser(id, "ADMIN");
  return NextResponse.json(data);
}
