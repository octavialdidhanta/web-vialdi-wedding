/**
 * Writes MCP deploy_edge_function payloads (one JSON per hub function).
 * Agent reads scripts/.deploy-payloads/<name>.json and calls MCP deploy_edge_function.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, ".deploy-payloads");

const functions = {
  "analytics-ingest": { verify_jwt: false },
  "wa-click-track": { verify_jwt: false },
  "traffic-refresh-rollups": { verify_jwt: true },
  "contact-lead": { verify_jwt: false },
  "contact-submit": { verify_jwt: false },
};

fs.mkdirSync(outDir, { recursive: true });

for (const [name, cfg] of Object.entries(functions)) {
  const indexPath = path.join(root, "..", "supabase", "functions", name, "index.ts");
  const content = fs.readFileSync(indexPath, "utf8");
  const payload = {
    name,
    entrypoint_path: "index.ts",
    verify_jwt: cfg.verify_jwt,
    files: [{ name: "index.ts", content }],
  };
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(payload));
  console.log("wrote", name, content.length, "chars");
}
