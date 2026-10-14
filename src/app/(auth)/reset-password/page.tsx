import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/forms";
export const metadata: Metadata = { title: "Choose a new password" };
export default function ResetPage() {
  return <AuthCard title="Choose a new password"><Suspense><ResetPasswordForm /></Suspense></AuthCard>;
}
