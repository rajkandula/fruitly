"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/types";

const KEY = "fruitly.cart.v1";
interface CartCtx {
  lines: CartLine[]; count: number; subtotalCents: number; hydrated: boolean;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}
const Ctx = createContext<CartCtx | null>(null);
export function useCart(): CartCtx { const c = useContext(Ctx); if (!c) throw new Error("useCart outside CartProvider"); return c; }

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setLines(JSON.parse(raw)); } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, hydrated]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY && e.newValue) { try { setLines(JSON.parse(e.newValue)); } catch {} } };
    window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((line: Omit<CartLine, "quantity">, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === line.productId);
      if (i >= 0) { const next = [...prev]; next[i] = { ...next[i], ...line, quantity: Math.min(next[i].quantity + qty, Math.max(1, line.stock), 99) }; return next; }
      return [...prev, { ...line, quantity: Math.min(qty, Math.max(1, line.stock), 99) }];
    });
  }, []);
  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) => qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => l.productId === productId ? { ...l, quantity: Math.min(qty, 99) } : l));
  }, []);
  const remove = useCallback((productId: number) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);
  const value = useMemo<CartCtx>(() => ({
    lines, hydrated, add, setQty, remove, clear,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotalCents: lines.reduce((s, l) => s + l.priceCents * l.quantity, 0),
  }), [lines, hydrated, add, setQty, remove, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
