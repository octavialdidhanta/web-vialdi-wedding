/**
 * Bersihkan folder deploy Edge Function: hanya config.toml + index.ts.
 * Sumber edit: supabase/functions-src/<nama>/index.ts + supabase/functions/_shared/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const functionsRoot = path.join(root, "..", "supabase", "functions");

const bundledFunctions = [
  "analytics-ingest",
  "wa-click-track",
  "traffic-refresh-rollups",
  "contact-lead",
  "contact-submit",
  "wedding-package-lead",
];

const keepInFolder = new Set(["index.ts", "config.toml"]);

for (const fn of bundledFunctions) {
  const dir = path.join(functionsRoot, fn);
  if (!fs.existsSync(dir)) continue;

  for (const sub of ["lib", "_shared"]) {
    fs.rmSync(path.join(dir, sub), { recursive: true, force: true });
  }

  for (const name of fs.readdirSync(dir)) {
    if (keepInFolder.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.unlinkSync(full);
    }
  }
}

console.log("Deploy folders: config.toml + index.ts only");
