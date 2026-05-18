/**
 * Apply remaining hub SQL migrations via Supabase MCP or Dashboard SQL editor.
 * Run after hub_properties_forms_submissions is applied:
 *   node scripts/apply-hub-migrations.mjs
 * Prints migration names + byte sizes; paste each file into SQL editor or use MCP apply_migration.
 */
import fs from "fs";
import path from "path";

const dir = path.join("supabase", "migrations");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("202606201") && f.endsWith(".sql"))
  .sort();

for (const f of files) {
  const full = path.join(dir, f);
  const sql = fs.readFileSync(full, "utf8");
  console.log(f, sql.length, "bytes");
}

console.log("\nApply in order via Supabase Dashboard or: MCP apply_migration per file.");
