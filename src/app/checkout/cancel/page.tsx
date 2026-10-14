import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderByNumber } from "@/lib/repo/orders";
import { cancelOrder } from "@/lib/checkout";

export default async function CancelPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: number } = await searchParams;
  const user = await getCurrentUser();
  if (number && user) {
    const order = await getOrderByNumber(number);
    if (order && order.user_id === user.id && order.payment_method === "card" && order.payment_status === "unpaid" && order.status === "pending") {
      await cancelOrder(order, "Card payment cancelled by customer"); // release the reserved stock
    }
  }
  return (
    <div className="container-x py-16 text-center">
      <h1 className="mt-4 text-3xl font-extrabold">Payment cancelled</h1>
      <p className="mt-2 text-gray-600">No charge was made. Your items are still waiting — you can try again anytime.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/checkout" className="btn-primary">Back to checkout</Link><Link href="/shop" className="btn-secondary">Keep shopping</Link></div>
    </div>
  );
}
