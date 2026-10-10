"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role } from "@/contexts/AuthContext";

const RequireRole = ({ role, children }: { role: Role | Role[]; children: ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();
  const roles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (user && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, roles, router]);

  if (!user || !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default RequireRole;
