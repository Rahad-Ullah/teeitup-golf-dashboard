"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { fetchUrl, BASE_URL, CLIENT_APP_HEADER, CLIENT_APP } from "@/lib/fetchUrl";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from "@/lib/apiToken";
import { decodeAccessToken, isTokenValid } from "@/lib/jwt";

export type Role = "admin" | "club_owner";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
  club?: string;
  mustResetPassword: boolean;
}

const toRole = (backendRole: string): Role =>
  backendRole === "SUPER_ADMIN" || backendRole === "ADMIN" ? "admin" : "club_owner";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: (force?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile using the current access token
  const fetchUserProfile = useCallback(async (token: string): Promise<boolean> => {
    try {
      const claims = decodeAccessToken(token);

      // If user must change their password, the backend blocks /users/me with 403,
      // so we use the claims directly from the token without hitting /users/me.
      if (claims?.mustResetPassword) {
        setUser({
          name: "",
          email: "",
          role: toRole(claims.role),
          mustResetPassword: true,
        });
        return true;
      }

      const res = await fetchUrl("/users/me");
      const dbUser = res.data;
      if (dbUser) {
        setUser({
          name: dbUser.fullName,
          email: dbUser.email,
          role: toRole(dbUser.role),
          club: dbUser.course ? String(dbUser.course) : undefined,
          mustResetPassword: false,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Refresh access token via backend endpoint
  // When force is false, it verifies whether the current accessToken is still valid.
  // If valid, it skips the network request entirely and returns the current token.
  const refreshSession = useCallback(async (force = false): Promise<string | null> => {
    try {
      const currentToken = getAccessToken();

      // If not forced and existing access token is still valid, skip the API call
      if (!force && isTokenValid(currentToken)) {
        return currentToken;
      }

      const refreshToken = getRefreshToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        [CLIENT_APP_HEADER]: CLIENT_APP,
      };

      if (refreshToken) {
        headers["Authorization"] = `Bearer ${refreshToken}`;
      }

      const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers,
        body: refreshToken
          ? JSON.stringify({ refreshToken, tiu_refresh_token_dashboard: refreshToken })
          : undefined,
      });

      if (!response.ok) return null;

      const data = await response.json();
      const newAccessToken = data.data?.accessToken;
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        return newAccessToken;
      }
      return null;
    } catch (err) {
      console.error("[AUTH] refreshSession threw error:", err);
      return null;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = getAccessToken();
        const refresh = getRefreshToken();
        console.log("[AUTH] initAuth on mount/reload:", {
          hasAccessToken: Boolean(token),
          isTokenValid: isTokenValid(token),
          hasRefreshToken: Boolean(refresh),
        });

        // 1. If existing access token is valid, use it directly (NO refresh request!)
        if (isTokenValid(token)) {
          if (token && isMounted) {
            const loaded = await fetchUserProfile(token);
            if (loaded) return;
          }
        }

        // 2. Only if access token is invalid, expired, or profile failed, call refresh
        const freshToken = await refreshSession(true);

        if (freshToken && isMounted) {
          await fetchUserProfile(freshToken);
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.error("[AUTH] initAuth error:", err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUserProfile, refreshSession]);

  const login: AuthContextType["login"] = async (email, password) => {
    try {
      const result = await fetchUrl("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const { accessToken, refreshToken, user: dbUser } = result.data;
      console.log("[AUTH] login succeeded. Got tokens:", {
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        refreshTokenLength: refreshToken?.length,
      });

      // Always save tokens directly to cookies
      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      const authUser: AuthUser = {
        name: dbUser.fullName,
        email: dbUser.email,
        role: toRole(dbUser.role),
        club: dbUser.course ? String(dbUser.course) : undefined,
        mustResetPassword: Boolean(dbUser.mustResetPassword),
      };

      setUser(authUser);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Invalid email or password.",
      };
    }
  };

  const logout = async () => {
    console.trace("[AUTH WARNING] logout() was called! Stack trace:");
    try {
      await fetchUrl("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      // Clear cookies directly
      removeAccessToken();
      removeRefreshToken();
      setUser(null);

      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = "/sign-in";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
