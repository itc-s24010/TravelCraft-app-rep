import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/auth"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Check for Firebase session cookie set after login
  const session = request.cookies.get("__session")?.value;

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/trips", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
