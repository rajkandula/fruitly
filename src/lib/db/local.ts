import path from "node:path";
import fs from "node:fs";
import { normalizeParams, type Db, type RunResult } from "./types";

/** Local-development fallback driver using better-sqlite3 (never used in production). */
export class LocalSqliteDb implements Db {
  readonly kind = "local-sqlite" as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(private conn: any) {}

  static async open(file: string): Promise<LocalSqliteDb> {
    // Resolved at runtime so bundlers don't require this dev-only native package in production builds.
    const pkg = ["better", "sqlite3"].join("-");
    const mod = await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ pkg);
    const Database = (mod as unknown as { default: new (f: string) => unknown }).default;
    // Dev-only path; the ignore comment keeps the bundler from tracing the whole project.
    const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const conn = new Database(abs) as unknown as { pragma: (s: string) => unknown };
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    return new LocalSqliteDb(conn);
  }
  async query<Row = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Row[]> {
    return this.conn.prepare(sql).all(...normalizeParams(params)) as Row[];
  }
  async get<Row = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Row | null> {
    return (this.conn.prepare(sql).get(...normalizeParams(params)) as Row | undefined) ?? null;
  }
  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const stmt = this.conn.prepare(sql);
    // Statements with RETURNING must be read via .all()/.get(); detect and adapt.
    if (/\bRETURNING\b/i.test(sql)) {
      const rows = stmt.all(...normalizeParams(params)) as Record<string, unknown>[];
      const last = rows[rows.length - 1];
      return { changes: rows.length, lastRowId: Number(last?.id ?? 0) };
    }
    const info = stmt.run(...normalizeParams(params)) as { changes: number; lastInsertRowid: number | bigint };
    return { changes: info.changes, lastRowId: Number(info.lastInsertRowid) };
  }
  async exec(sql: string): Promise<void> {
    this.conn.exec(sql);
  }
}
