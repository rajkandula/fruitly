import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Price({ cents, compareAt, unit, className, size = "md" }: { cents: number; compareAt?: number | null; unit?: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const main = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn("font-bold tracking-tight tabular-nums", main)}>{formatMoney(cents)}</span>
      {unit && <span className="text-xs text-gray-500">/ {unit}</span>}
      {compareAt && compareAt > cents ? <span className="text-xs text-gray-400 line-through tabular-nums">{formatMoney(compareAt)}</span> : null}
    </span>
  );
}
