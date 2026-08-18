import { type NextRequest, NextResponse } from "next/server";

/**
 * Server-side logout.
 * Uses a raw 302 with a relative Location so the proxy URL is resolved
 * correctly by the browser, and an explicit Set-Cookie to expire __session.
 */
export function GET(_request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: `${base}/login`,
      "Set-Cookie": "__session=; Path=/; Max-Age=0; SameSite=Lax",
    },
  });
}
