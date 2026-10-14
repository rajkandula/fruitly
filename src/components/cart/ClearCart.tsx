"use client";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
/** Clears the local cart once an order has been placed (rendered on the success page). */
export function ClearCart() {
  const { clear, hydrated } = useCart();
  useEffect(() => { if (hydrated) { clear(); try { sessionStorage.removeItem("fruitly.coupon"); } catch {} } }, [hydrated, clear]);
  return null;
}
