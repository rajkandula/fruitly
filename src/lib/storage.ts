import { env } from "./env";
import { harakumo } from "./harakumo";

export function storageEnabled(): boolean { return Boolean(harakumo() && env.harakumoBucketId); }

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg" };

/** Presigns a PUT for a product image; the browser uploads straight to Harakumo Storage. Returns the public proxy URL to store on the product. */
export async function presignProductImageUpload(contentType: string, originalName: string) {
  const hk = harakumo();
  if (!hk || !env.harakumoBucketId) throw new Error("Storage is not configured");
  if (!ALLOWED.has(contentType)) throw new Error("Unsupported image type");
  const safe = originalName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe.replace(/\.[a-z0-9]+$/, "")}.${EXT[contentType]}`;
  const { url, expiresIn } = await hk.storage.presign(env.harakumoBucketId, { key, method: "put", contentType });
  return { uploadUrl: url, key, expiresIn, publicUrl: `/api/media/${key}` };
}

/** Presigned GET for serving an object through our /api/media proxy (storage objects are private). */
export async function presignedGetUrl(key: string): Promise<string> {
  const hk = harakumo();
  if (!hk || !env.harakumoBucketId) throw new Error("Storage is not configured");
  const { url } = await hk.storage.presign(env.harakumoBucketId, { key, method: "get" });
  return url;
}
