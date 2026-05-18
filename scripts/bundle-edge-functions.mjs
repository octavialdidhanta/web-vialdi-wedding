/**
 * Bundle supabase/functions-src/<name>/index.ts → supabase/functions/<name>/index.ts
 * Folder deploy = config.toml + index.ts saja (seperti link-redirect).
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");
const functionsRoot = path.join(repoRoot, "supabase", "functions");
const sourcesRoot = path.join(repoRoot, "supabase", "functions-src");

const defaultFunctions = [
  "analytics-ingest",
  "wa-click-track",
  "traffic-refresh-rollups",
  "contact-lead",
  "contact-submit",
  "wedding-package-lead",
];

const names = process.argv.slice(2).length ? process.argv.slice(2) : defaultFunctions;

for (const name of names) {
  const entrySrc = path.join(sourcesRoot, name, "index.ts");
  const out = path.join(functionsRoot, name, "index.ts");
  const fnDir = path.join(functionsRoot, name);

  if (!fs.existsSync(entrySrc)) {
    console.error("Missing source:", entrySrc);
    process.exit(1);
  }

  const q = (p) => `"${p.replace(/"/g, '\\"')}"`;
  execSync(
    `npx --yes esbuild ${q(entrySrc)} --bundle --format=esm --platform=neutral --outfile=${q(out)} --log-level=info`,
    { stdio: "inherit", cwd: repoRoot, shell: true },
  );

  const banner = "// @ts-nocheck\n";
  const bundled = fs.readFileSync(out, "utf8");
  if (!bundled.startsWith("// @ts-nocheck")) {
    fs.writeFileSync(out, banner + bundled);
  }

  console.log(name, ": bundled -> functions/" + name + "/index.ts");
}
