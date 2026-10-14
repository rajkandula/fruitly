import Link from "next/link";
import { Citrus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brand mark + wordmark. */
export function Logo({ size = "md", href = "/", className }: { size?: "sm" | "md"; href?: string | null; className?: string }) {
  const box = size === "md" ? "h-9 w-9 rounded-xl" : "h-8 w-8 rounded-lg";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const text = size === "md" ? "text-xl" : "text-lg";
  const inner = (
    <span className={cn("flex items-center gap-2 font-extrabold tracking-tight text-leaf-900", text, className)}>
      <span className={cn("grid place-items-center bg-gradient-to-br from-leaf-700 to-leaf-900 text-white shadow-soft", box)}><Citrus className={icon} strokeWidth={2.25} /></span>
      Fruitly
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
