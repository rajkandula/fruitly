/**
 * Tiny in-memory TTL cache (per server instance) for hot catalogue reads.
 * Database round-trips over REST cost ~200–1000 ms, so caching categories/product lists for a few seconds
 * makes storefront pages snappy. Admin mutations call `invalidate()`.
 */
const store = new Map<string, { value: unknown; expires: number }>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  store.set(key, { value, expires: Date.now() + ttlMs });
  if (store.size > 2000) for (const [k, v] of store) if (v.expires <= Date.now()) store.delete(k);
  return value;
}

/** Invalidate every key starting with one of the prefixes (or everything when none given). */
export function invalidate(...prefixes: string[]) {
  if (!prefixes.length) { store.clear(); return; }
  for (const k of store.keys()) if (prefixes.some((p) => k.startsWith(p))) store.delete(k);
}
