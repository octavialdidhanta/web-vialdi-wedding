/**
 * Reads scripts/.deploy-payloads/*.json and prints deploy order.
 * Deploy is done via Cursor MCP tool deploy_edge_function (user-supabase).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), ".deploy-payloads");
const names = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
console.log("Payloads ready for MCP deploy_edge_function:", names.join(", "));
console.log("Run: npm run bundle:edge-functions && node scripts/prepare-mcp-deploy-payloads.mjs");
