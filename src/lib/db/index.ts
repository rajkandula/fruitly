import { env } from "../env";
import { harakumo } from "../harakumo";
import type { Db } from "./types";
import { RemoteD1Db } from "./remote";

export type { Db, RunResult } from "./types";

let instance: Db | null = null;

/**
 * Returns the application database.
 *  - Harakumo Edge SQLite when HARAKUMO_API_KEY + HARAKUMO_DATABASE_ID are set (production & normal dev).
 *  - A local better-sqlite3 file otherwise (offline dev / CI).
 */
export async function db(): Promise<Db> {
  if (instance) return instance;
  const hk = harakumo();
  if (hk && env.harakumoDatabaseId) {
    instance = new RemoteD1Db(hk, env.harakumoDatabaseId);
    return instance;
  }
  if (env.isProd) {
    throw new Error("Database not configured: set HARAKUMO_API_KEY and HARAKUMO_DATABASE_ID");
  }
  const { LocalSqliteDb } = await import("./local");
  instance = await LocalSqliteDb.open(env.localDbPath);
  return instance;
}

export function resetDbInstance() { instance = null; }
