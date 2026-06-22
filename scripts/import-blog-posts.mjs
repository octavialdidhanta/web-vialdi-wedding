/**
 * Import blog posts vialdi-wedding dari project Supabase sumber → CMS baru.
 *
 * Env:
 *   SUPABASE_CMS_DB_PASSWORD (wajib)
 *   SUPABASE_ACCESS_TOKEN (wajib — akses project sumber Synckerja)
 *   SUPABASE_SOURCE_PROJECT_REF=wqdzqqshoifwyrltzgvx (default)
 *   VITE_SUPABASE_URL — project CMS tujuan
 *
 *   npm run cms:import-posts
 */
import pg from "pg";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const SOURCE_REF = process.env.SUPABASE_SOURCE_PROJECT_REF ?? "wqdzqqshoifwyrltzgvx";
const WEB_ID = process.env.VITE_CMS_PROPERTY_SLUG ?? process.env.VITE_WEB_ID ?? "vialdi-wedding";
const token = process.env.SUPABASE_ACCESS_TOKEN;
const cmsPassword = process.env.SUPABASE_CMS_DB_PASSWORD;
const cmsUrl = process.env.VITE_SUPABASE_URL ?? "";

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN — diperlukan untuk baca posts dari project sumber.");
  process.exit(1);
}
if (!cmsPassword) {
  console.error("Missing SUPABASE_CMS_DB_PASSWORD");
  process.exit(1);
}

const OLD_STORAGE_HOST = "https://wqdzqqshoifwyrltzgvx.supabase.co";
const cmsStorageHost = cmsUrl.replace(/\/$/, "");

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

function normalizeCoverPath(path) {
  if (!path || typeof path !== "string") return null;
  const p = path.trim();
  if (!p) return null;
  if (p.startsWith(`${WEB_ID}/`)) return p;
  return `${WEB_ID}/${p.replace(/^\//, "")}`;
}

function rewriteStorageUrls(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replaceAll(OLD_STORAGE_HOST, cmsStorageHost)
    .replaceAll(
      "/storage/v1/object/public/blog-media/4ad75249-72b8-45e8-ba90-23c9868a8f64/",
      `/storage/v1/object/public/blog-media/${WEB_ID}/4ad75249-72b8-45e8-ba90-23c9868a8f64/`,
    );
}

function rewriteBodyJson(node) {
  if (node == null) return node;
  if (typeof node === "string") return rewriteStorageUrls(node);
  if (Array.isArray(node)) return node.map(rewriteBodyJson);
  if (typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "src" && typeof v === "string") {
        out[k] = rewriteStorageUrls(v);
      } else {
        out[k] = rewriteBodyJson(v);
      }
    }
    return out;
  }
  return node;
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

async function ensureCategory(client) {
  await client.query(
    `insert into public.blog_categories (id, slug, name, web_id)
     values ('cccccccc-cc01-4000-8000-000000000001', 'umum', 'Umum', $1)
     on conflict (web_id, slug) do update set name = excluded.name`,
    [WEB_ID],
  );
}

async function main() {
  console.log(`Source: ${SOURCE_REF} → CMS: ${cmsProjectRef()} (${WEB_ID})`);

  const rows = await querySource(
    `select id, slug, title, excerpt, status, featured, accent,
            cover_image_path, cover_image_url, body_json, body_html, toc_json,
            read_time_minutes, category_id, published_at, scheduled_at
     from public.posts
     where web_id = '${WEB_ID}'
     order by coalesce(published_at, created_at)`,
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("No posts found on source project.");
    return;
  }

  const { client, ref } = await connectCms();
  try {
    await ensureCategory(client);

    let imported = 0;
    for (const row of rows) {
      const bodyJson = rewriteBodyJson(row.body_json ?? {});
      const bodyHtml = rewriteStorageUrls(row.body_html ?? "");
      const coverPath = normalizeCoverPath(row.cover_image_path);
      let categoryId = row.category_id;
      if (categoryId) {
        const { rows: cats } = await client.query(
          `select id from public.blog_categories where id = $1 and web_id = $2`,
          [categoryId, WEB_ID],
        );
        if (cats.length === 0) categoryId = null;
      }

      await client.query(
        `insert into public.posts (
          id, web_id, slug, title, excerpt, status, featured, accent,
          cover_image_path, cover_image_url, body_json, body_html, toc_json,
          read_time_minutes, category_id, published_at, scheduled_at,
          created_by, updated_by
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11::jsonb, $12, $13::jsonb,
          $14, $15, $16, $17,
          null, null
        )
        on conflict (web_id, slug) do update set
          title = excluded.title,
          excerpt = excluded.excerpt,
          status = excluded.status,
          featured = excluded.featured,
          accent = excluded.accent,
          cover_image_path = excluded.cover_image_path,
          cover_image_url = excluded.cover_image_url,
          body_json = excluded.body_json,
          body_html = excluded.body_html,
          toc_json = excluded.toc_json,
          read_time_minutes = excluded.read_time_minutes,
          category_id = excluded.category_id,
          published_at = excluded.published_at,
          scheduled_at = excluded.scheduled_at,
          updated_at = now()`,
        [
          row.id,
          WEB_ID,
          row.slug,
          row.title,
          row.excerpt ?? "",
          row.status,
          row.featured ?? false,
          row.accent ?? "navy",
          coverPath,
          row.cover_image_url,
          JSON.stringify(bodyJson),
          bodyHtml,
          JSON.stringify(row.toc_json ?? []),
          row.read_time_minutes ?? 1,
          categoryId,
          row.published_at,
          row.scheduled_at,
        ],
      );
      imported++;
      console.log(`  OK ${row.slug}`);
    }

    const { rows: count } = await client.query(
      `select count(*)::int as n from public.posts where web_id = $1`,
      [WEB_ID],
    );
    console.log(`\nDone. ${imported} imported/updated. CMS total: ${count[0].n} posts.`);
    console.log(
      "\nCatatan: salin file blog-media dari bucket project lama ke CMS jika gambar belum tampil.",
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nImport failed:", err.message ?? err);
  process.exit(1);
});
