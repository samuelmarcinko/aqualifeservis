import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Two responsibilities:
 *  1. Host-based routing: pozicovna.aqualife.sk serves the public rental
 *     storefront (the internal /najom tree). Everything on that host is
 *     rewritten under /najom; the admin app is not reachable there.
 *  2. Admin auth gate (portal host): redirect unauthenticated requests away
 *     from app routes based on session-cookie presence (UX only; real
 *     authorization is enforced server-side everywhere).
 */

const PROTECTED_PREFIXES = [
  "/prehlad",
  "/zakaznici",
  "/cenove-ponuky",
  "/protokoly",
  "/katalog",
  "/pozicovna",
  "/pouzivatelia",
  "/nastavenia",
];

function isPublicRentalHost(host: string): boolean {
  return host.startsWith("pozicovna.");
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  // 1. Public rental storefront host.
  if (isPublicRentalHost(host)) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/najom") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = `/najom${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. On the portal host, hide the internal public tree.
  if (pathname === "/najom" || pathname.startsWith("/najom/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 3. Admin auth gate.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isProtected) {
    const cookie = getSessionCookie(req);
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/prihlasenie";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
