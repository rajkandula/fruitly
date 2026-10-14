import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/forms";
export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPage() {
  return <AuthCard title="Reset your password" subtitle="We'll email you a 6-digit code." footer={<Link href="/login" className="link">Back to sign in</Link>}><Suspense><ForgotPasswordForm /></Suspense></AuthCard>;
}
