import { NextResponse } from "next/server";
import { apiRegister } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const data = await apiRegister(name, email, password);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    const status = msg.includes("already") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
