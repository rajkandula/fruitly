import type { Db } from "./types";
import { MIGRATIONS, MIGRATIONS_TABLE } from "./schema";

/** Splits a SQL script into individual statements (good enough for our DDL — no semicolons inside literals). */
export function splitStatements(sql: string): string[] {
  return sql.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
}

export async function migrate(database: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  await database.exec(MIGRATIONS_TABLE);
  const applied = new Set((await database.query<{ name: string }>("SELECT name FROM _migrations")).map((r) => r.name));
  const ran: string[] = [];
  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    log(`applying ${m.name}`);
    for (const stmt of splitStatements(m.sql)) {
      await database.exec(stmt);
    }
    await database.run("INSERT INTO _migrations (name) VALUES (?)", [m.name]);
    ran.push(m.name);
  }
  return ran;
}
