import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("tiu_refresh_token_dashboard")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/sign-in") ||
                     pathname.startsWith("/forgot-password") ||
                     pathname.startsWith("/verify-otp") ||
                     pathname.startsWith("/reset-password");

  // If no refresh token cookie exists and the user is trying to access a protected page, redirect to sign-in
  if (!token && !isAuthPage) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // We no longer redirect away from auth pages in the proxy. The cookie might
  // exist but be revoked/expired. It's safer to let the client-side AuthContext
  // verify the session and redirect them to the dashboard if it's truly valid.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads/public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
