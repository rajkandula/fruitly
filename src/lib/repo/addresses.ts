import { db } from "../db";
import type { Address } from "../types";

export async function listAddresses(userId: number): Promise<Address[]> {
  const database = await db();
  return database.query<Address>("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", [userId]);
}
export async function getAddress(userId: number, id: number): Promise<Address | null> {
  const database = await db();
  return database.get<Address>("SELECT * FROM addresses WHERE user_id = ? AND id = ?", [userId, id]);
}
export type AddressInput = Omit<Address, "id" | "user_id" | "created_at" | "is_default" | "line2" | "phone"> & { line2?: string | null; phone?: string | null; is_default?: boolean };
export async function createAddress(userId: number, a: AddressInput): Promise<Address> {
  const database = await db();
  const existing = await database.get<{ n: number }>("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?", [userId]);
  const makeDefault = a.is_default || (existing?.n ?? 0) === 0;
  if (makeDefault) await database.run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
  const res = await database.run(
    `INSERT INTO addresses (user_id, label, full_name, line1, line2, city, state, postal_code, country, phone, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, a.label || "Home", a.full_name, a.line1, a.line2 ?? null, a.city, a.state ?? "", a.postal_code, a.country || "US", a.phone ?? null, makeDefault ? 1 : 0]);
  return (await getAddress(userId, res.lastRowId))!;
}
export async function updateAddress(userId: number, id: number, a: AddressInput): Promise<Address | null> {
  const database = await db();
  if (a.is_default) await database.run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
  await database.run(
    `UPDATE addresses SET label = ?, full_name = ?, line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, is_default = CASE WHEN ? THEN 1 ELSE is_default END
      WHERE user_id = ? AND id = ?`,
    [a.label || "Home", a.full_name, a.line1, a.line2 ?? null, a.city, a.state ?? "", a.postal_code, a.country || "US", a.phone ?? null, a.is_default ? 1 : 0, userId, id]);
  return getAddress(userId, id);
}
export async function deleteAddress(userId: number, id: number) {
  const database = await db();
  await database.run("DELETE FROM addresses WHERE user_id = ? AND id = ?", [userId, id]);
}
