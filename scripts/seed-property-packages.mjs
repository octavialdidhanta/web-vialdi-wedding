/**
 * Seed property_packages untuk vialdi-wedding (7 paket wedding).
 * Tidak memakai updated_by — aman di project CMS baru.
 *
 *   npm run cms:seed-packages
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const root = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(
  root,
  "..",
  "supabase",
  "migrations-cms",
  "seed_property_packages_vialdi_wedding.sql",
);

const password = process.env.SUPABASE_CMS_DB_PASSWORD;
if (!password) {
  console.error("Missing SUPABASE_CMS_DB_PASSWORD in .env");
  process.exit(1);
}

const ref = cmsProjectRef();
const enc = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;

async function main() {
  const sql = fs.readFileSync(seedPath, "utf8");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    console.log(`Seeding property_packages (vialdi-wedding) on ${ref}...`);
    await client.query(sql);
    const { rows } = await client.query(
      `select count(*)::int as n from public.property_packages where web_id = 'vialdi-wedding'`,
    );
    console.log(`Done. ${rows[0].n} paket vialdi-wedding.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
