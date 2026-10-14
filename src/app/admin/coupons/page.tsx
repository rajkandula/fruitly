import { db } from "@/lib/db";
import type { Coupon } from "@/lib/repo/coupons";
import { CouponsManager } from "@/components/admin/CouponsManager";
export default async function AdminCoupons() {
  const database = await db();
  const coupons = await database.query<Coupon>("SELECT * FROM coupons ORDER BY id DESC");
  return <div className="card p-5"><h2 className="text-lg font-bold">Coupons</h2><CouponsManager coupons={coupons} /></div>;
}
