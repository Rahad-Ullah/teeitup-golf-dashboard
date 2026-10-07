let clientAccessToken = "";

export const setAccessTokenCookie = (token: string) => {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `accessToken=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
};

export const removeAccessTokenCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

export const setClientToken = (token: string) => {
  clientAccessToken = token;
  if (token) {
    setAccessTokenCookie(token);
  } else {
    removeAccessTokenCookie();
  }
};

export const getClientToken = () => clientAccessToken;

