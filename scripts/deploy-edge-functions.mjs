/**
 * Bundle (functions-src → functions) + deploy.
 *   npm run deploy:edge
 *   npm run deploy:edge -- contact-submit
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");
const functionsRoot = path.join(repoRoot, "supabase", "functions");

/** @type {Record<string, { bundle?: boolean; noVerifyJwt?: boolean }>} */
const FUNCTIONS = {
  "analytics-ingest": { bundle: true, noVerifyJwt: true },
  "wa-click-track": { bundle: true, noVerifyJwt: true },
  "traffic-refresh-rollups": { bundle: true, noVerifyJwt: false },
  "contact-lead": { bundle: true, noVerifyJwt: true },
  "contact-submit": { bundle: true, noVerifyJwt: true },
  "wedding-package-lead": { bundle: true, noVerifyJwt: true },
  "whatsapp-webhook": { bundle: false, noVerifyJwt: true },
  "link-redirect": { bundle: false, noVerifyJwt: true },
};

function readVerifyJwtFromToml(fn) {
  const p = path.join(functionsRoot, fn, "config.toml");
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, "utf8").match(/verify_jwt\s*=\s*(true|false)/i);
  return m ? m[1].toLowerCase() === "true" : null;
}

function loadAccessToken() {
  const envPath = path.join(repoRoot, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/);
      if (m) return m[1].trim();
    }
  }
  return process.env.SUPABASE_ACCESS_TOKEN ?? "";
}

const args = process.argv.slice(2);
const names = args.length ? args : Object.keys(FUNCTIONS);

for (const name of names) {
  if (!FUNCTIONS[name]) {
    console.error("Unknown function:", name);
    process.exit(1);
  }
}

execSync("node scripts/sync-edge-shared.mjs", { cwd: repoRoot, stdio: "inherit" });

const toBundle = names.filter((n) => FUNCTIONS[n].bundle);
if (toBundle.length) {
  execSync(`node scripts/bundle-edge-functions.mjs ${toBundle.join(" ")}`, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

const token = loadAccessToken();
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "wqdzqqshoifwyrltzgvx";
const env = { ...process.env };
if (token) env.SUPABASE_ACCESS_TOKEN = token;

for (const name of names) {
  const cfg = FUNCTIONS[name];
  const tomlJwt = readVerifyJwtFromToml(name);
  const verifyJwt = tomlJwt ?? !cfg.noVerifyJwt;
  const jwtFlag = verifyJwt ? "" : " --no-verify-jwt";
  console.log(`\n>>> deploy ${name}${jwtFlag || " (verify_jwt on)"}`);
  execSync(`npx supabase functions deploy ${name} --project-ref ${projectRef}${jwtFlag}`, {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });
}

console.log("\nDone.");
