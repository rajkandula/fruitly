import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listAddresses } from "@/lib/repo/addresses";
import { cardPaymentsEnabled } from "@/lib/payments";
import { env } from "@/lib/env";
import { fulfillmentConfig } from "@/lib/delivery";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  if (!user.email_verified) redirect(`/verify-email?email=${encodeURIComponent(user.email)}&next=/checkout`);
  const addresses = await listAddresses(user.id);
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-gray-600">Signed in as <b>{user.name}</b> ({user.email})</p>
      <CheckoutForm addresses={addresses} user={{ name: user.name, phone: user.phone }} payments={{ card: await cardPaymentsEnabled(), cod: env.codEnabled }} fulfilment={fulfillmentConfig()} madeToOrder={env.madeToOrder} />
    </div>
  );
}
