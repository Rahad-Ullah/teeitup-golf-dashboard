import type { Metadata } from "next";
import ChangePassword from "./ChangePassword";

export const metadata: Metadata = {
  title: "Change Password",
};

export default function ChangePasswordPage() {
  return <ChangePassword />;
}