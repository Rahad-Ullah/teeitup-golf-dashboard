import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/sign-in",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
];

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken =
    request.cookies.get("tiu_refresh_token_dashboard")?.value ||
    request.cookies.get("tiu_refresh_token")?.value ||
    request.cookies.get("refreshToken")?.value;

  const hasAuth = Boolean(accessToken || refreshToken);
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated users cannot access private pages
  if (!hasAuth && !isAuthPage) {
    const signInUrl = new URL("/sign-in", request.url);
    if (pathname !== "/") {
      signInUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  // 2. Authenticated users cannot access auth entry pages
  if (hasAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files with extensions (e.g. .svg, .png, .jpg, .jpeg, .gif, .webp)
     * - api routes
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};