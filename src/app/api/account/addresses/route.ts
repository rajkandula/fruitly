import { handler, json, parseBody, requireUser } from "@/lib/api";
import { addressSchema } from "@/lib/validation";
import { createAddress, listAddresses } from "@/lib/repo/addresses";

export const GET = handler(async () => { const user = await requireUser(); return json({ addresses: await listAddresses(user.id) }); });
export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, addressSchema);
  return json({ address: await createAddress(user.id, body) }, { status: 201 });
});
