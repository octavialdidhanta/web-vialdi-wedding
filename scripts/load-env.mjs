import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Load KEY=VALUE lines from .env into process.env (does not override existing). */
export function loadDotEnv(fileName = ".env") {
  const envPath = path.join(repoRoot, fileName);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function cmsProjectRef() {
  const url = process.env.VITE_SUPABASE_URL ?? "";
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? process.env.SUPABASE_CMS_PROJECT_REF ?? "ivjawlslccxpnioluooh";
}
