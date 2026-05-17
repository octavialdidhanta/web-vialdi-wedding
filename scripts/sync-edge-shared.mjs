/**
 * Copy hub modules from supabase/functions/_shared into each Edge Function root.
 * Deploy bundler includes root-level .ts files only (not lib/ or ./_shared subdirs).
 * Run after editing _shared: npm run sync:edge-shared
 */
import fs from "fs";
import path from "path";

const functionsRoot = path.join("supabase", "functions");
const src = path.join(functionsRoot, "_shared");

/** @type {Record<string, string[]>} */
const filesByFunction = {
  "analytics-ingest": ["resolveWebId.ts"],
  "wa-click-track": ["resolveWebId.ts"],
  "traffic-refresh-rollups": ["resolveWebId.ts"],
  "contact-lead": ["supabaseAdmin.ts", "cors.ts"],
  "contact-submit": [
    "attribution.ts",
    "cors.ts",
    "crmLeadSync.ts",
    "extractDenormalized.ts",
    "rateLimitByWebId.ts",
    "resolveWebId.ts",
    "supabaseAdmin.ts",
    "validateFormStep.ts",
  ],
};

const allManagedFiles = new Set(
  Object.values(filesByFunction).flat(),
);

if (!fs.existsSync(src)) {
  console.error("Missing canonical folder:", src);
  process.exit(1);
}

for (const [fn, files] of Object.entries(filesByFunction)) {
  const fnDir = path.join(functionsRoot, fn);
  if (!fs.existsSync(fnDir)) {
    console.error("Missing function folder:", fnDir);
    process.exit(1);
  }

  fs.rmSync(path.join(fnDir, "lib"), { recursive: true, force: true });
  fs.rmSync(path.join(fnDir, "_shared"), { recursive: true, force: true });

  const keep = new Set(files);
  for (const name of fs.readdirSync(fnDir)) {
    if (!name.endsWith(".ts") || name === "index.ts") continue;
    if (allManagedFiles.has(name) && !keep.has(name)) {
      fs.unlinkSync(path.join(fnDir, name));
    }
  }

  for (const file of files) {
    const from = path.join(src, file);
    const to = path.join(fnDir, file);
    if (!fs.existsSync(from)) {
      console.error("Missing source:", from);
      process.exit(1);
    }
    fs.copyFileSync(from, to);
  }

  console.log("synced", fn, "->", files.join(", "));
}
