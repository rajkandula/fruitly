import fs from "node:fs";
import path from "node:path";

/** Loads .env.local (and .env) into process.env without overriding existing values. */
export function loadEnv() {
  for (const f of [".env", ".env.local"]) {
    const p = path.resolve(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

/** Upserts keys into .env.local, preserving other lines. */
export function writeEnvLocal(updates: Record<string, string>) {
  const p = path.resolve(process.cwd(), ".env.local");
  const lines = fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n") : [];
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m && updates[m[1]] !== undefined) { seen.add(m[1]); return `${m[1]}=${updates[m[1]]}`; }
    return line;
  });
  for (const [k, v] of Object.entries(updates)) if (!seen.has(k)) out.push(`${k}=${v}`);
  fs.writeFileSync(p, out.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
  for (const [k, v] of Object.entries(updates)) process.env[k] = v;
}

export const log = {
  info: (m: string) => console.log(`\x1b[36m›\x1b[0m ${m}`),
  ok: (m: string) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m: string) => console.log(`\x1b[33m!\x1b[0m ${m}`),
  err: (m: string) => console.error(`\x1b[31m✗\x1b[0m ${m}`),
};
