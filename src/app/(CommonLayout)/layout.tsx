"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ForcePasswordReset from "@/components/auth/ForcePasswordReset";
import { useAuth } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Use window.location.href instead of router.replace for auth redirects
      // to guarantee a clean slate and avoid Next.js client-side router hangs.
      window.location.href = "/sign-in";
    }
  }, [isLoading, user]);

  // While session is being restored or user just logged in and state is
  // propagating, show a neutral loading screen — do NOT redirect yet.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-gray-400">
        Loading...
      </div>
    );
  }

  // After loading is complete, if there is still no user the useEffect above
  // will redirect. Render a fallback UI in the meantime to avoid a flash,
  // but we MUST render {children} (even if hidden) so Next.js doesn't crash
  // and router.replace() works correctly.
  if (!user) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-gray-400">
          Redirecting...
        </div>
        <div className="hidden">{children}</div>
      </>
    );
  }

  if (user.mustResetPassword) {
    return <ForcePasswordReset />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}