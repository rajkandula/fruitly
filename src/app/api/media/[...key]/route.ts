import { handler, fail } from "@/lib/api";
import { presignedGetUrl, storageEnabled } from "@/lib/storage";

/** Streams a private storage object (product images) through a short-lived presigned URL, with CDN-friendly caching. */
export const GET = handler<{ params: Promise<{ key: string[] }> }>(async (_req, { params }) => {
  if (!storageEnabled()) return fail(404, "Not found");
  const key = (await params).key.map(decodeURIComponent).join("/");
  if (!key || key.includes("..")) return fail(400, "Bad key");
  const url = await presignedGetUrl(key);
  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) return fail(404, "Not found");
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  const len = upstream.headers.get("content-length"); if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
  return new Response(upstream.body, { status: 200, headers });
});
