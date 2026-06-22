/**
 * Import home_floating_whatsapp_settings dari project Supabase sumber → CMS.
 *
 *   npm run cms:import-floating-whatsapp
 */
import pg from "pg";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const SOURCE_REF = process.env.SUPABASE_SOURCE_PROJECT_REF ?? "wqdzqqshoifwyrltzgvx";
const WEB_ID = process.env.VITE_CMS_PROPERTY_SLUG ?? process.env.VITE_WEB_ID ?? "vialdi-wedding";
const token = process.env.SUPABASE_ACCESS_TOKEN;
const cmsPassword = process.env.SUPABASE_CMS_DB_PASSWORD;

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}
if (!cmsPassword) {
  console.error("Missing SUPABASE_CMS_DB_PASSWORD");
  process.exit(1);
}

async function querySource(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${SOURCE_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    throw new Error(`Source query failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log(`Source: ${SOURCE_REF} → CMS: ${cmsProjectRef()} (${WEB_ID})`);

  const rows = await querySource(
    `select web_id, is_enabled, phone_digits, prefill_message, updated_at
     from public.home_floating_whatsapp_settings
     where web_id = '${WEB_ID}'`,
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`No settings for web_id=${WEB_ID} on source.`);
    return;
  }

  const row = rows[0];
  const enc = encodeURIComponent(cmsPassword);
  const client = new pg.Client({
    connectionString: `postgresql://postgres:${enc}@db.${cmsProjectRef()}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(
      `insert into public.home_floating_whatsapp_settings (
        web_id, is_enabled, phone_digits, prefill_message, updated_at
      ) values ($1, $2, $3, $4, $5)
      on conflict (web_id) do update set
        is_enabled = excluded.is_enabled,
        phone_digits = excluded.phone_digits,
        prefill_message = excluded.prefill_message,
        updated_at = excluded.updated_at`,
      [
        row.web_id,
        row.is_enabled ?? false,
        row.phone_digits,
        row.prefill_message ?? "",
        row.updated_at,
      ],
    );
    console.log(
      `OK — enabled=${row.is_enabled}, phone=${row.phone_digits ?? "(null)"}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nImport failed:", err.message ?? err);
  process.exit(1);
});
