import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/auth", "/api/logout"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Check for Firebase session cookie set after login
  const session = request.cookies.get("__session")?.value;

  // Only block unauthenticated access to protected routes.
  // Do NOT redirect /login → /trips here: the cookie may be stale and the
  // server-side logout route needs /login to be reachable immediately after
  // clearing the cookie.  The login page itself handles the already-logged-in
  // case client-side.
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
