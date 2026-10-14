import { z } from "zod";
import { handler, json, fail, parseBody, requireVerifiedUser } from "@/lib/api";
import { getProductBySlug } from "@/lib/repo/products";
import { listReviews, ratingSummary, upsertReview, userHasPurchased } from "@/lib/repo/reviews";
import { getCurrentUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ slug: string }> };
export const GET = handler<Ctx>(async (_req, { params }) => {
  const product = await getProductBySlug((await params).slug);
  if (!product) return fail(404, "Product not found");
  const user = await getCurrentUser();
  const [reviews, summary] = await Promise.all([listReviews(product.id), ratingSummary(product.id)]);
  return json({ reviews, summary, mine: user ? reviews.find((r) => r.user_id === user.id) ?? null : null });
});
const schema = z.object({ rating: z.number().int().min(1).max(5), title: z.string().trim().max(100).optional().default(""), body: z.string().trim().min(3, "Say a little more").max(2000) });
/** Create or update the signed-in user's review for a product. */
export const POST = handler<Ctx>(async (req, { params }) => {
  const user = await requireVerifiedUser();
  const product = await getProductBySlug((await params).slug);
  if (!product) return fail(404, "Product not found");
  const body = await parseBody(req, schema);
  const verified = await userHasPurchased(user.id, product.id);
  await upsertReview({ productId: product.id, userId: user.id, rating: body.rating, title: body.title, body: body.body, verified });
  return json({ ok: true, summary: await ratingSummary(product.id), reviews: await listReviews(product.id) }, { status: 201 });
});
