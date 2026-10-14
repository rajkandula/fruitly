import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/forms";
export const metadata: Metadata = { title: "Create account" };
export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/account");
  return <AuthCard title="Create your account" subtitle="Fresh fruit is one step away." footer={<>Already have an account? <Link href="/login" className="link">Sign in</Link></>}><SignupForm /></AuthCard>;
}
