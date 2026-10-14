/**
 * Connects the git repo to the Harakumo project and triggers a production deploy.
 *   REPO_URL=https://github.com/you/fruitly-store npm run harakumo:deploy
 */
import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { Harakumo } = await import("../src/lib/harakumo");
const hk = new Harakumo();
const projectId = process.env.HARAKUMO_PROJECT_ID;
if (!projectId) { log.err("HARAKUMO_PROJECT_ID missing — run npm run harakumo:setup first"); process.exit(1); }
const repoUrl = process.env.REPO_URL || process.argv[2];
const branch = process.env.REPO_BRANCH || "main";
if (repoUrl) { const r = await hk.deployments.connectRepo(projectId, { repoUrl, branch }); log.ok(`repo connected: ${JSON.stringify(r)}`); }
const push = await hk.deployments.push(projectId, branch);
log.ok(`deploy triggered: ${JSON.stringify(push)}`);
const { deployments } = await hk.deployments.list(projectId);
console.log(JSON.stringify(deployments.slice(0, 3), null, 2));
