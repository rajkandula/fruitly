/**
 * Deploys straight to Harakumo with no git host involved:
 *   build locally -> pack source + prebuilt .next -> POST /api/projects/:id/deployments/upload -> poll
 *
 * The build machine has a tight time budget, so we do the slow parts here:
 *  - dev-only/native packages are stripped from the uploaded package.json (nothing to compile there)
 *  - the prebuilt .next is shipped as ONE archive (the upload has a file-count ceiling) and the
 *    container's "build" step just unpacks it
 *
 *   npm run harakumo:deploy
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnv, log } from "./_shared.mts";
loadEnv();

const projectId = process.env.HARAKUMO_PROJECT_ID;
const apiKey = process.env.HARAKUMO_API_KEY;
const baseUrl = (process.env.HARAKUMO_BASE_URL ?? "https://harakumo.com").replace(/\/$/, "");
if (!projectId || !apiKey) { log.err("HARAKUMO_PROJECT_ID and HARAKUMO_API_KEY are required"); process.exit(1); }

/** devDependencies the build machine doesn't need (we ship a prebuilt .next). */
const STRIP_DEPS = ["better-sqlite3", "@types/better-sqlite3", "tsx"];
const run = (cmd: string, cwd?: string) => execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" });

const root = process.cwd();
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "harakumo-deploy-"));
try {
  log.info("building locally (clean) …");
  // A dev server leaves hundreds of MB of artifacts in .next; always start from a clean production build.
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  run("npx next build", root);
  if (!fs.existsSync(path.join(root, ".next/BUILD_ID"))) throw new Error("build produced no .next/BUILD_ID");

  log.info("staging source …");
  run(`tar --exclude='./node_modules' --exclude='./.next' --exclude='./.git' --exclude='./.env.local' --exclude='./data' --exclude='./scripts' -cf - . | tar -xf - -C ${JSON.stringify(stage)}`, root);

  // Ship the build output as a single file: the upload endpoint rejects very large file counts.
  log.info("packing prebuilt output …");
  // NB: the exclude pattern must match the member path as written ('.next/cache', not './.next/cache'),
  // otherwise the dev-server build cache (hundreds of MB) ends up in the upload.
  run(`tar -czf ${JSON.stringify(path.join(stage, "next-build.tar.gz"))} --exclude='.next/cache' .next`, root);
  const outMb = fs.statSync(path.join(stage, "next-build.tar.gz")).size / 1024 / 1024;
  log.info(`prebuilt output: ${outMb.toFixed(1)} MB`);
  if (outMb > 20) throw new Error(`prebuilt output is ${outMb.toFixed(1)} MB — too large to upload; clear .next and rebuild`);

  const pkg = JSON.parse(fs.readFileSync(path.join(stage, "package.json"), "utf8"));
  for (const d of STRIP_DEPS) { delete pkg.dependencies?.[d]; delete pkg.devDependencies?.[d]; }
  delete pkg.devDependencies;              // nothing is compiled on the build machine
  delete pkg.allowScripts;
  pkg.scripts = { build: "tar -xzf next-build.tar.gz && echo 'unpacked prebuilt .next'", start: "next start" };
  fs.writeFileSync(path.join(stage, "package.json"), JSON.stringify(pkg, null, 2));
  fs.rmSync(path.join(stage, "package-lock.json"), { force: true });
  run("npm install --package-lock-only --omit=dev --silent", stage);

  const tarball = path.join(stage, "..", `fruitly-upload-${Date.now()}.tar.gz`);
  run(`tar -czf ${JSON.stringify(tarball)} -C ${JSON.stringify(stage)} .`);
  const bytes = fs.statSync(tarball).size;
  const files = run(`tar -tzf ${JSON.stringify(tarball)}`).split("\n").filter((l) => l && !l.endsWith("/")).length;
  log.info(`uploading ${(bytes / 1024 / 1024).toFixed(1)} MB (${files} files) …`);

  // The upload endpoint 500s intermittently; retry a few times before giving up.
  const payload = fs.readFileSync(tarball);
  let body: { deployment?: { id: number }; error?: string } = {};
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/deployments/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/gzip" },
      body: payload,
    });
    const raw = await res.text();
    body = {};
    try { body = JSON.parse(raw); } catch { /* non-JSON error page */ }
    if (res.ok && body.deployment) break;
    const why = body.error ?? `HTTP ${res.status}: ${raw.replace(/<[^>]+>/g, " ").trim().slice(0, 120)}`;
    if (attempt === 4) throw new Error(`upload failed after 4 attempts — ${why}`);
    log.warn(`upload attempt ${attempt} failed (${why}); retrying …`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  const id = body.deployment!.id;
  log.ok(`deployment #${id} queued`);

  let status = "queued", logs = "", url: string | null = null;
  const started = Date.now();
  while (!["ready", "failed", "error"].includes(status)) {
    await new Promise((r) => setTimeout(r, 8000));
    const d = await fetch(`${baseUrl}/api/deployments/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const j = (await d.json()) as { deployment: { status: string; logs?: string; preview_url?: string } };
    status = j.deployment.status; logs = j.deployment.logs ?? ""; url = j.deployment.preview_url || null;
    process.stdout.write(`\r  ${status} … ${Math.round((Date.now() - started) / 1000)}s`);
    if (Date.now() - started > 5 * 60_000) break;
  }
  process.stdout.write("\n");
  if (status === "ready" && url) { log.ok(`live at ${url}`); }
  else {
    log.err(`deployment ${status}`);
    console.log(logs.split("\n").filter((l) => !l.includes("LIBARCHIVE.xattr")).slice(-25).join("\n"));
    process.exitCode = 1;
  }
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
