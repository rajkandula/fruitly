import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
export function Stars({ value, size = "sm", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn(px, i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />)}
    </span>
  );
}
