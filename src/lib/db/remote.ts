import type { Harakumo } from "../harakumo";
import { normalizeParams, type Db, type RunResult } from "./types";

/** Database driver backed by Harakumo Edge SQLite over REST. */
export class RemoteD1Db implements Db {
  readonly kind = "harakumo-sqlite" as const;
  constructor(private hk: Harakumo, private databaseId: string) {}

  async query<Row = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Row[]> {
    const res = await this.hk.databases.query<Row>(this.databaseId, sql, normalizeParams(params));
    return Array.isArray(res?.results) ? res.results : [];
  }
  async get<Row = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Row | null> {
    const rows = await this.query<Row>(sql, params);
    return rows[0] ?? null;
  }
  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const res = await this.hk.databases.query(this.databaseId, sql, normalizeParams(params));
    return { changes: res?.meta?.changes ?? 0, lastRowId: res?.meta?.last_row_id ?? 0 };
  }
  async exec(sql: string): Promise<void> {
    await this.hk.databases.query(this.databaseId, sql);
  }
}
