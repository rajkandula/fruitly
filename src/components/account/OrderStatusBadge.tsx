import { cn } from "@/lib/utils";
const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", confirmed: "bg-blue-100 text-blue-800", processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800", delivered: "bg-leaf-100 text-leaf-800", cancelled: "bg-red-100 text-red-700",
  paid: "bg-leaf-100 text-leaf-800", unpaid: "bg-amber-100 text-amber-800", failed: "bg-red-100 text-red-700", refunded: "bg-gray-200 text-gray-700",
};
export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("badge capitalize", styles[status] ?? "bg-gray-100 text-gray-700", className)}>{status.replace("_", " ")}</span>;
}
