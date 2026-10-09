import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeAccessToken, isTokenValid } from "@/lib/jwt";

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

  // Validate token validity (checks JWT structure and expiration)
  const hasValidAccessToken = isTokenValid(accessToken);
  const hasValidRefreshToken = refreshToken && isTokenValid(refreshToken);
  const hasAuth = hasValidAccessToken || hasValidRefreshToken;
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isChangePasswordPage = pathname.startsWith("/change-password");

  // 1. Unauthenticated users cannot access private pages or change-password
  if (!hasAuth) {
    if (!isAuthPage) {
      const signInUrl = new URL("/sign-in", request.url);
      if (pathname !== "/") {
        signInUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // 2. Users required to change password can ONLY access /change-password
  const claims = accessToken ? decodeAccessToken(accessToken) : null;
  const mustResetPassword = Boolean(claims?.mustResetPassword);

  if (mustResetPassword) {
    if (!isChangePasswordPage) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.next();
  }

  // 3. Authenticated users who do NOT need password reset cannot access auth pages
  if (isAuthPage) {
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