import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Lightweight edge gate: redirects unauthenticated requests away from app
 * routes based on session-cookie presence. This is a UX optimization only —
 * authoritative authorization happens server-side in every page/action/route.
 */
const PROTECTED_PREFIXES = [
  "/prehlad",
  "/zakaznici",
  "/cenove-ponuky",
  "/protokoly",
  "/katalog",
  "/pouzivatelia",
  "/nastavenia",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const cookie = getSessionCookie(req);
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/prihlasenie";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/prehlad/:path*",
    "/zakaznici/:path*",
    "/cenove-ponuky/:path*",
    "/protokoly/:path*",
    "/katalog/:path*",
    "/pouzivatelia/:path*",
    "/nastavenia/:path*",
  ],
};
