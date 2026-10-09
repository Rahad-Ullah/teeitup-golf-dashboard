"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import InputFieldPassword from "@/components/form/InputFieldPassword";
import { fetchUrl } from "@/lib/fetchUrl";
import { toast } from "sonner";

interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (!data.oldPassword) {
      setFormError("Please enter your old password.");
      return;
    }

    if (!data.newPassword) {
      setFormError("Please enter your new password.");
      return;
    }

    if (data.newPassword.length < 6) {
      setFormError("New password must be at least 6 characters long.");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setFormError("New password and confirm password do not match.");
      return;
    }

    if (data.oldPassword === data.newPassword) {
      setFormError("New password must be different from old password.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await fetchUrl("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: data.oldPassword,
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        },
      });

      toast.success("Password changed successfully!");
      reset();
      router.replace("/");
    } catch (err: any) {
      const errMsg = err?.message || "Failed to change password.";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-115 rounded-[20px] bg-white p-6 lg:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-gray-100"
    >
      <div className="mb-10">
        <h2 className="text-[36px] font-bold tracking-tight text-[#111827]">
          Change Password
        </h2>
        <p className="mt-2 text-[#6B7280] text-lg">
          Enter your old password and choose a new one.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <InputFieldPassword
          title="Old Password"
          name="oldPassword"
          placeholder="••••••••"
          register={register}
          error={errors.oldPassword}
        />
        <InputFieldPassword
          title="New Password"
          name="newPassword"
          placeholder="••••••••"
          register={register}
          error={errors.newPassword}
        />
        <InputFieldPassword
          title="Confirm Password"
          name="confirmPassword"
          placeholder="••••••••"
          register={register}
          error={errors.confirmPassword}
        />

        {formError && (
          <p className="text-sm font-medium text-red-500">{formError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-2xl bg-[#142d22] py-4 text-[17px] font-bold text-white transition-all hover:bg-[#1a3a2e] hover:shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? "Changing password..." : "Change Password"}
        </button>
      </form>
    </motion.div>
  );
};

export default ChangePassword;
