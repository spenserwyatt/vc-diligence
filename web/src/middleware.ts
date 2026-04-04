import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "vc-auth";

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;

  // No password set — skip auth entirely (local dev)
  if (!password) return NextResponse.next();

  // Already authenticated
  if (request.cookies.get(COOKIE_NAME)?.value === password) {
    return NextResponse.next();
  }

  // Login page and API — don't redirect loop
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/api/login"
  ) {
    return NextResponse.next();
  }

  // Everything else — redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    // Protect all pages and API routes except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
