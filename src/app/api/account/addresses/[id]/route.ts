import { handler, json, fail, parseBody, requireUser } from "@/lib/api";
import { addressSchema } from "@/lib/validation";
import { deleteAddress, getAddress, updateAddress } from "@/lib/repo/addresses";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!(await getAddress(user.id, id))) return fail(404, "Address not found");
  const body = await parseBody(req, addressSchema);
  return json({ address: await updateAddress(user.id, id, body) });
});
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  await deleteAddress(user.id, Number((await params).id));
  return json({ ok: true });
});
