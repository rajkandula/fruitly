import { z } from "zod";
import { handler, json, fail, parseBody, requireAdmin } from "@/lib/api";
import { presignProductImageUpload, storageEnabled } from "@/lib/storage";
/** Returns a presigned PUT URL (Harakumo Storage) so the admin browser uploads the image directly. */
export const POST = handler(async (req) => {
  await requireAdmin();
  if (!storageEnabled()) return fail(503, "Storage is not configured (set HARAKUMO_BUCKET_ID).");
  const { contentType, fileName } = await parseBody(req, z.object({ contentType: z.string().min(3).max(100), fileName: z.string().min(1).max(200) }));
  try { return json(await presignProductImageUpload(contentType, fileName)); }
  catch (err) { return fail(400, err instanceof Error ? err.message : "Upload failed"); }
});
