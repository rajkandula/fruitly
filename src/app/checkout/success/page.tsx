import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderByNumber, getOrderItems } from "@/lib/repo/orders";
import { formatMoney } from "@/lib/utils";
import { ConfirmPayment } from "@/components/cart/ConfirmPayment";
import { ClearCart } from "@/components/cart/ClearCart";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: number } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/success?order=${number ?? ""}`)}`);
  const order = number ? await getOrderByNumber(number) : null;
  if (!order || (order.user_id !== user.id && user.role !== "admin")) return <div className="container-x py-16 text-center"><h1 className="text-2xl font-bold">Order not found</h1><Link href="/account/orders" className="btn-primary mt-4">My orders</Link></div>;
  const items = await getOrderItems(order.id);
  const needsConfirm = order.payment_method === "card" && order.payment_status !== "paid";
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl">
        <ClearCart />
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-leaf-600" />
          <h1 className="mt-4 text-3xl font-extrabold">Thank you, {user.name.split(" ")[0]}!</h1>
          <p className="mt-2 text-gray-600">Order <b className="font-mono">{order.order_number}</b> {order.payment_method === "cod" ? "is confirmed — pay the driver on delivery." : "is being confirmed."}</p>
          {needsConfirm && <ConfirmPayment orderNumber={order.order_number} />}
          <ul className="mt-6 divide-y divide-line text-left text-sm">
            {items.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.name} × {i.quantity}</span><span className="tabular-nums">{formatMoney(i.line_total_cents)}</span></li>)}
            <li className="flex justify-between py-2 font-bold"><span>Total</span><span className="tabular-nums">{formatMoney(order.total_cents)}</span></li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">A confirmation email is on its way to <b>{order.email}</b>.</p>
          <div className="mt-6 flex justify-center gap-3"><Link href={`/account/orders/${order.id}`} className="btn-primary">Track order</Link><Link href="/shop" className="btn-secondary">Keep shopping</Link></div>
        </div>
      </div>
    </div>
  );
}
