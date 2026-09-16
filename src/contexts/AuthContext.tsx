"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchUrl } from "@/lib/fetchUrl";
import { setClientToken } from "@/lib/apiToken";
import { decodeAccessToken } from "@/lib/jwt";

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
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mints a fresh access token from the refresh cookie. The server embeds
  // mustResetPassword in the token itself and blocks every route except
  // /auth/change-password while it's true — so that claim is read straight
  // off the token instead of via GET /users/me, which would just 403.
  const refreshSession = async () => {
    try {
      const refreshResult = await fetchUrl("/auth/refresh-token", { method: "POST" });
      const accessToken = refreshResult.data?.accessToken;
      if (!accessToken) {
        setUser(null);
        return;
      }

      setClientToken(accessToken);
      const claims = decodeAccessToken(accessToken);

      if (claims?.mustResetPassword) {
        setUser({ name: "", email: "", role: toRole(claims.role), mustResetPassword: true });
        return;
      }

      const profileResult = await fetchUrl("/users/me");
      const dbUser = profileResult.data;
      setUser({
        name: dbUser.fullName,
        email: dbUser.email,
        role: toRole(dbUser.role),
        club: dbUser.course ? String(dbUser.course) : undefined,
        mustResetPassword: false,
      });
    } catch (err) {
      console.log("No active session or session restoration failed");
      setUser(null);
    }
  };

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  const login: AuthContextType["login"] = async (email, password) => {
    try {
      const result = await fetchUrl("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const { accessToken, user: dbUser } = result.data;
      setClientToken(accessToken);

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
        message: err.message || "Invalid email or password."
      };
    }
  };

  const logout = async () => {
    try {
      await fetchUrl("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      setClientToken("");
      
      if (typeof window !== "undefined") {
        // Clear localStorage and sessionStorage completely
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        // Clear all accessible cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Force a full page reload to the sign-in page to guarantee all React
        // state (including anything relying on the now-deleted localStorage) is
        // wiped cleanly. This prevents white screen crashes during transition.
        window.location.href = "/sign-in";
      } else {
        setUser(null);
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
