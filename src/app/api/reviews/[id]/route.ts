import { handler, json, requireUser } from "@/lib/api";
import { deleteReview } from "@/lib/repo/reviews";
/** Delete own review (admins can delete any). */
export const DELETE = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  await deleteReview(Number((await params).id), user.role === "admin" ? undefined : user.id);
  return json({ ok: true });
});
