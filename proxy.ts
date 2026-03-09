import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// Paths accessible without auth
const PUBLIC_PATHS = ["/", "/signin", "/register", "/unauthorized", "/api/auth", "/api/images", "/_next"];

export const proxy = auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static files
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Not signed in → sign in
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Signed in but not ADMIN → unauthorized
  if (role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
