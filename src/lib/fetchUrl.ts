import { getClientToken, setClientToken } from "./apiToken";
import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Tells the backend which frontend is calling, so it can hand out a
// separate refresh-token cookie per app. Without this, the website and
// dashboard — both calling this same backend host — would share one
// browser cookie (cookies aren't port-scoped), so logging into one would
// silently hijack the other's session.
const CLIENT_APP_HEADER = "X-Client-App";
const CLIENT_APP = "dashboard";

// Media URLs come back as paths relative to the API server's origin
// (e.g. "/uploads/xyz.jpg"), not the "/api/v1"-prefixed BASE_URL.
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

export const getMediaUrl = (path?: string | null): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
};

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

// Singleton refresh state — prevents concurrent refresh races and stops
// retry attempts once the session is definitively expired for this page load.
// NOTE: These are module-level so they persist across calls within one page
// lifetime, but reset on every hard reload (which is exactly what we want).
let refreshPromise: Promise<string | null> | null = null;
let sessionExpired = false;

// Called when the refresh endpoint confirms the session is gone.
// Clears local token state and marks the session as expired so no
// further refresh attempts are made. Does NOT redirect — the route
// guard in (CommonLayout)/layout.tsx handles that via router.replace().
const clearClientSession = () => {
  sessionExpired = true;
  refreshPromise = null;
  setClientToken("");
  if (typeof window !== "undefined") {
    window.sessionStorage.clear();
  }
};

// React cache ensures this runs at most once per SSR request
const getServerAccessToken = cache(async (cookieHeader: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        [CLIENT_APP_HEADER]: CLIENT_APP,
      },
    });
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data?.accessToken || null;
  } catch {
    return null;
  }
});

export async function fetchUrl(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const isServer = typeof window === "undefined";
  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set(CLIENT_APP_HEADER, CLIENT_APP);

  // Forward credentials/auth based on environment
  if (isServer) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }
  } else {
    const clientToken = getClientToken();
    if (clientToken) {
      headers.set("Authorization", `Bearer ${clientToken}`);
    }
  }

  const fetchConfig: RequestInit = {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  };

  if (!isServer) {
    fetchConfig.credentials = "include";
  }

  let response = await fetch(url, fetchConfig);

  // Handle token refresh on 401 Unauthorized. Only attempt this for requests
  // that actually sent a bearer token — public endpoints like /auth/login
  // also return 401 for plain wrong-credentials errors, which have nothing
  // to do with an expired access token and should surface as-is below.
  const sentAuthHeader = headers.has("Authorization");
  if (response.status === 401 && (endpoint === "/auth/refresh-token" || sentAuthHeader)) {
    if (endpoint === "/auth/refresh-token") {
      // The refresh endpoint itself returned 401 — the session is definitively gone.
      // Clear token state and throw so the caller (AuthContext.refreshSession) can
      // set user=null, which triggers the route guard to do router.replace("/sign-in").
      // We must NOT call window.location.href here — that causes a hard reload which
      // resets this module's sessionExpired flag and starts the loop all over again.
      if (!isServer) {
        clearClientSession();
        try {
          await fetch(`${BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: { [CLIENT_APP_HEADER]: CLIENT_APP },
          });
        } catch {}
      }
    } else {
      if (isServer) {
        const { cookies } = await import("next/headers");
        const cookieHeader = (await cookies()).toString();
        if (cookieHeader) {
          const newAccessToken = await getServerAccessToken(cookieHeader);
          if (newAccessToken) {
            headers.set("Authorization", `Bearer ${newAccessToken}`);
            response = await fetch(url, fetchConfig);
          }
        }
      } else if (!sessionExpired) {
        // Client-side refresh — use a singleton promise so concurrent 401s
        // all wait on the same single refresh call instead of each firing one.
        if (!refreshPromise) {
          refreshPromise = fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            credentials: "include",
            headers: { [CLIENT_APP_HEADER]: CLIENT_APP },
          })
            .then(async (r) => {
              if (!r.ok) throw new Error("Refresh failed");
              const d = await r.json();
              const token = d.data?.accessToken;
              if (!token) throw new Error("No access token returned");
              return token as string;
            })
            .catch(() => null)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        if (newAccessToken) {
          setClientToken(newAccessToken);
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, fetchConfig);
        } else {
          // Refresh returned null — session is gone. Clear state and let the
          // error propagate so AuthContext.refreshSession sets user=null and
          // the layout's route guard does the redirect cleanly.
          clearClientSession();
          try {
            await fetch(`${BASE_URL}/auth/logout`, {
              method: "POST",
              credentials: "include",
              headers: { [CLIENT_APP_HEADER]: CLIENT_APP },
            });
          } catch {}
          throw { status: 401, message: "Session expired", data: {} };
        }
      }
    }
  }

  const responseText = await response.text();
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    responseData = { message: responseText };
  }

  if (!response.ok) {
    // Field-level validation errors (e.g. Zod) come back as
    // { message: "Validation Error", errors: [{ field, message }] }.
    // The generic top-level message is useless on its own — surface the
    // specific field complaints instead so the UI can show what's wrong.
    const fieldErrors = Array.isArray(responseData.errors) ? responseData.errors : null;
    const message = fieldErrors?.length
      ? fieldErrors
          .map((e: { field?: string; message: string }) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(" — ")
      : responseData.message || "Request failed";

    throw {
      status: response.status,
      message,
      data: responseData,
    };
  }

  return responseData;
}
