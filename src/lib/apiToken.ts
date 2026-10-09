import { getCookie, setCookie, deleteCookie } from "cookies-next/client";

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "tiu_refresh_token_dashboard";

const getCookieOption = () => ({
  path: "/",
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
});

// Access Token helpers (always read/write directly from cookies)
export const getAccessToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const token = getCookie(ACCESS_TOKEN_KEY);
  return typeof token === "string" && token ? token : null;
};

export const setAccessToken = (token: string) => {
  if (typeof document === "undefined") return;
  setCookie(ACCESS_TOKEN_KEY, token, {
    ...getCookieOption(),
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
};

export const removeAccessToken = () => {
  if (typeof document === "undefined") return;
  deleteCookie(ACCESS_TOKEN_KEY, { path: "/" });
};

// Refresh Token helpers (read/write directly from cookies)
export const getRefreshToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const token =
    getCookie(REFRESH_TOKEN_KEY) ||
    getCookie("tiu_refresh_token") ||
    getCookie("refreshToken");
  return typeof token === "string" && token ? token : null;
};

export const setRefreshToken = (token: string) => {
  if (typeof document === "undefined") return;
  setCookie(REFRESH_TOKEN_KEY, token, {
    ...getCookieOption(),
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
};

export const removeRefreshToken = () => {
  if (typeof document === "undefined") return;
  deleteCookie(REFRESH_TOKEN_KEY, { path: "/" });
  deleteCookie("tiu_refresh_token", { path: "/" });
  deleteCookie("refreshToken", { path: "/" });
};

// Backwards-compatible aliases (ensures existing callers like fetchUrl work seamlessly)
export const getClientToken = (): string => getAccessToken() ?? "";
export const setClientToken = (token: string) => {
  if (token) {
    setAccessToken(token);
  } else {
    removeAccessToken();
  }
};
export const setAccessTokenCookie = setAccessToken;
export const removeAccessTokenCookie = removeAccessToken;
