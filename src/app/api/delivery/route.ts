import { handler, json } from "@/lib/api";
import { fulfillmentConfig, servesPostal, outOfZoneMessage } from "@/lib/delivery";

/** Fulfilment options; pass ?postal=<code> to also get a zone verdict. */
export const GET = handler(async (req) => {
  const postal = new URL(req.url).searchParams.get("postal");
  const cfg = fulfillmentConfig();
  if (postal) return json({ ...cfg, postal, inZone: servesPostal(postal), message: servesPostal(postal) ? null : outOfZoneMessage() });
  return json(cfg);
});
