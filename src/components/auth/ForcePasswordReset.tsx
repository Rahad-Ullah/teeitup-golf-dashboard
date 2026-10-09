"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { fetchUrl } from "@/lib/fetchUrl";
import { useAuth } from "@/contexts/AuthContext";

interface ForceResetInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ForcePasswordReset = () => {
  const { refreshSession, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForceResetInputs>();

  const onSubmit = async (data: ForceResetInputs) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchUrl("/auth/change-password", {
        method: "POST",
        body: { currentPassword: data.currentPassword, newPassword: data.newPassword },
      });
      toast.success("Password changed! Loading your dashboard...");
      await refreshSession(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Set a New Password</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your account was just created. Replace the temporary password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Temporary Password</label>
            <input
              type="password"
              {...register("currentPassword", { required: true, minLength: 6 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2ea268]/20 focus:border-[#2ea268] transition-all"
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <p className="text-xs font-medium text-red-500">Temporary password is required.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">New Password</label>
            <input
              type="password"
              {...register("newPassword", { required: true, minLength: 6, maxLength: 72 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2ea268]/20 focus:border-[#2ea268] transition-all"
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="text-xs font-medium text-red-500">New password must be 6-72 characters.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
            <input
              type="password"
              {...register("confirmPassword", { required: true })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2ea268]/20 focus:border-[#2ea268] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#142d22] hover:bg-[#1a3a2e] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#142d22]/20 transition-all disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update Password & Continue"}
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Log out instead
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordReset;
