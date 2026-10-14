"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
const KEY = "fruitly.wishlist.v1";
interface Ctx { ids: number[]; has: (id: number) => boolean; toggle: (id: number) => boolean; hydrated: boolean }
const C = createContext<Ctx | null>(null);
export const useWishlist = () => { const c = useContext(C); if (!c) throw new Error("useWishlist outside provider"); return c; };
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]); const [hydrated, setHydrated] = useState(false);
  useEffect(() => { try { const r = localStorage.getItem(KEY); if (r) setIds(JSON.parse(r)); } catch {} setHydrated(true); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(ids)); }, [ids, hydrated]);
  const has = useCallback((id: number) => ids.includes(id), [ids]);
  const toggle = useCallback((id: number) => { let added = false; setIds((p) => { if (p.includes(id)) return p.filter((x) => x !== id); added = true; return [...p, id]; }); return added; }, []);
  const value = useMemo(() => ({ ids, has, toggle, hydrated }), [ids, has, toggle, hydrated]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
