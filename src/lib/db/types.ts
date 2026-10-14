export interface RunResult { changes: number; lastRowId: number }

export interface Db {
  readonly kind: "harakumo-sqlite" | "local-sqlite";
  /** SELECT-style query: returns rows. */
  query<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<Row[]>;
  /** Returns the first row or null. */
  get<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<Row | null>;
  /** INSERT/UPDATE/DELETE: returns change info. */
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  /** Execute one or more statements with no params (DDL / migrations). */
  exec(sql: string): Promise<void>;
}

/** Normalises JS values to what SQLite understands. */
export function normalizeParams(params: unknown[] = []): unknown[] {
  return params.map((p) => {
    if (p === undefined) return null;
    if (p instanceof Date) return p.toISOString();
    if (typeof p === "boolean") return p ? 1 : 0;
    if (typeof p === "bigint") return Number(p);
    if (p !== null && typeof p === "object") return JSON.stringify(p);
    return p;
  });
}
