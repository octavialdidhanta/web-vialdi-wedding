/**
 * Prints deploy_edge_function MCP arguments JSON for one function.
 * Usage: node scripts/mcp-deploy-from-payload.mjs wa-click-track
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const name = process.argv[2];
if (!name) {
  console.error("Usage: node scripts/mcp-deploy-from-payload.mjs <function-name>");
  process.exit(1);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), ".deploy-payloads");
const payloadPath = path.join(dir, `${name}.json`);

if (!fs.existsSync(payloadPath)) {
  const indexPath = path.join(dir, "..", "..", "supabase", "functions", name, "index.ts");
  if (!fs.existsSync(indexPath)) {
    console.error("Missing payload and index.ts for", name);
    process.exit(1);
  }
  const content = fs.readFileSync(indexPath, "utf8");
  const payload = {
    name,
    entrypoint_path: "index.ts",
    verify_jwt: name === "traffic-refresh-rollups",
    files: [{ name: "index.ts", content }],
  };
  fs.writeFileSync(payloadPath, JSON.stringify(payload));
  console.error("wrote", payloadPath, content.length, "chars");
}

const p = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const out = {
  name: p.name,
  entrypoint_path: p.entrypoint_path ?? "index.ts",
  verify_jwt: p.verify_jwt ?? false,
  files: p.files,
};
process.stdout.write(JSON.stringify(out));
