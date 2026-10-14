import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { OtpForm } from "@/components/auth/forms";
export const metadata: Metadata = { title: "Enter your code" };
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  const login = purpose === "login";
  return <AuthCard title={login ? "Check your email" : "Verify your email"} subtitle={login ? "Enter the one-time code to sign in." : "One last step to activate your account."}><Suspense><OtpForm /></Suspense></AuthCard>;
}
