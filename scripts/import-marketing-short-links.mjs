/**
 * Import marketing short links dari project Supabase sumber → CMS baru.
 *
 * Env:
 *   SUPABASE_CMS_DB_PASSWORD (wajib)
 *   SUPABASE_ACCESS_TOKEN (wajib — akses project sumber Synckerja)
 *   SUPABASE_SOURCE_PROJECT_REF=wqdzqqshoifwyrltzgvx (default)
 *   VITE_SUPABASE_URL — project CMS tujuan
 *
 *   npm run cms:import-short-links
 */
import pg from "pg";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const SOURCE_REF = process.env.SUPABASE_SOURCE_PROJECT_REF ?? "wqdzqqshoifwyrltzgvx";
const token = process.env.SUPABASE_ACCESS_TOKEN;
const cmsPassword = process.env.SUPABASE_CMS_DB_PASSWORD;

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN — diperlukan untuk baca short links dari project sumber.");
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
    const text = await res.text();
    throw new Error(`Source query failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function connectCms() {
  const ref = cmsProjectRef();
  const enc = encodeURIComponent(cmsPassword);
  const client = new pg.Client({
    connectionString: `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return { client, ref };
}

async function main() {
  console.log(`Source: ${SOURCE_REF} → CMS: ${cmsProjectRef()}`);

  const links = await querySource(
    `select id, slug, site_origin, pathname,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            active, click_count, visitor_count, created_at, updated_at
     from public.marketing_short_links
     order by slug`,
  );

  if (!Array.isArray(links) || links.length === 0) {
    console.log("No short links found on source project.");
    return;
  }

  const visitors = await querySource(
    `select link_id, visitor_key, first_seen_at
     from public.marketing_short_link_visitors
     where link_id in (select id from public.marketing_short_links)`,
  );

  const { client } = await connectCms();
  try {
    let imported = 0;
    for (const row of links) {
      await client.query(
        `insert into public.marketing_short_links (
          id, slug, site_origin, pathname,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          active, click_count, visitor_count, created_at, updated_at, created_by
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, null
        )
        on conflict (slug) do update set
          site_origin = excluded.site_origin,
          pathname = excluded.pathname,
          utm_source = excluded.utm_source,
          utm_medium = excluded.utm_medium,
          utm_campaign = excluded.utm_campaign,
          utm_content = excluded.utm_content,
          utm_term = excluded.utm_term,
          active = excluded.active,
          click_count = excluded.click_count,
          visitor_count = excluded.visitor_count,
          updated_at = excluded.updated_at`,
        [
          row.id,
          row.slug,
          row.site_origin,
          row.pathname,
          row.utm_source,
          row.utm_medium,
          row.utm_campaign,
          row.utm_content,
          row.utm_term,
          row.active ?? true,
          row.click_count ?? 0,
          row.visitor_count ?? 0,
          row.created_at,
          row.updated_at,
        ],
      );
      imported++;
      console.log(`  OK ${row.slug} (clicks=${row.click_count ?? 0}, visitors=${row.visitor_count ?? 0})`);
    }

    let visitorsImported = 0;
    if (Array.isArray(visitors) && visitors.length > 0) {
      for (const v of visitors) {
        const res = await client.query(
          `insert into public.marketing_short_link_visitors (link_id, visitor_key, first_seen_at)
           values ($1, $2, $3)
           on conflict (link_id, visitor_key) do nothing`,
          [v.link_id, v.visitor_key, v.first_seen_at],
        );
        if (res.rowCount > 0) visitorsImported++;
      }
      console.log(`\nVisitors: ${visitorsImported} new row(s) (${visitors.length} on source).`);
    }

    const { rows: verify } = await client.query(
      `select count(*)::int as n,
              coalesce(sum(click_count), 0)::bigint as clicks,
              coalesce(sum(visitor_count), 0)::bigint as visitors
       from public.marketing_short_links`,
    );
    const { rows: col } = await client.query(
      `select exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'marketing_short_links'
           and column_name = 'visitor_count'
       ) as ok`,
    );
    if (!col[0]?.ok) {
      throw new Error("visitor_count column missing — run npm run cms:migrate:short-links first");
    }

    console.log(
      `\nDone. ${imported} link(s) imported/updated. CMS total: ${verify[0].n} links, ${verify[0].clicks} clicks, ${verify[0].visitors} visitors.`,
    );
    console.log("Buka /admin/short-links — harapan tabel tanpa error PGRST204.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nImport failed:", err.message ?? err);
  process.exit(1);
});
