import type { Metadata } from "next";
import VerifyOtp from "./VerifyOtp";

export const metadata: Metadata = {
  title: "Verify OTP",
};

export default function VerifyOtpPage() {
  return <VerifyOtp />;
}
