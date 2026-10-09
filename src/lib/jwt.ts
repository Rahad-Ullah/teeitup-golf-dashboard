import { decodeJwt } from "jose";

export interface AccessTokenClaims {
  userId: string;
  role: string;
  mustResetPassword: boolean;
  exp?: number;
  iat?: number;
}

// Client-side read of the access token's own claims using jose — not a security
// boundary (the server re-verifies on every request), just lets the UI
// react to mustResetPassword without calling routes the server blocks
// for accounts that haven't reset their temporary password yet.
export const decodeAccessToken = (token: string): AccessTokenClaims | null => {
  try {
    return decodeJwt<AccessTokenClaims>(token);
  } catch {
    return null;
  }
};

/**
 * Checks whether an access token exists, is well-formed, and has not expired.
 * Includes a safety buffer (default: 30 seconds) to avoid sending nearly-expired tokens.
 */
export const isTokenValid = (
  token: string | null | undefined,
  bufferSeconds: number = 30
): boolean => {
  if (!token) return false;
  const claims = decodeAccessToken(token);
  if (!claims) return false;
  if (!claims.exp) return true; // If no exp claim, treat as valid
  return claims.exp * 1000 > Date.now() + bufferSeconds * 1000;
};
