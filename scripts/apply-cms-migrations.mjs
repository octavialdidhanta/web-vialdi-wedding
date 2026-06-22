/**
 * Apply CMS migrations to the project in VITE_SUPABASE_URL.
 *
 * Requires SUPABASE_CMS_DB_PASSWORD in .env (Database password from Supabase Dashboard).
 *
 *   npm run cms:migrate          # full CMS schema
 *   npm run cms:migrate:min      # only cms_blog_schema (#1)
 *   npm run cms:migrate -- --resume   # skip #1, lanjut dari agency_posts (recovery)
 *   npm run cms:migrate:packages      # property_packages saja (recovery /admin/packages)
 *   npm run cms:migrate:short-links     # visitor_count + RPC short links
 *   npm run cms:migrate:floating-whatsapp  # home_floating_whatsapp_settings
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import {
  CMS_LOGIN_MIN_MIGRATION,
  CMS_LOGIN_PLAN_MIGRATIONS,
  CMS_LOGIN_RESUME_FROM_AGENCY,
  CMS_LOGIN_RESUME_FROM_BLOG_HUB,
  CMS_LOGIN_RESUME_FLOATING_WHATSAPP,
  CMS_LOGIN_RESUME_PACKAGES,
  CMS_LOGIN_RESUME_SHORT_LINKS,
} from "./cms-login-plan-manifest.mjs";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");
const migrationsRoot = path.join(repoRoot, "supabase");

const minOnly = process.argv.includes("--min");
const resume = process.argv.includes("--resume");
const resumeBlog = process.argv.includes("--resume-blog");
const resumePackages = process.argv.includes("--resume-packages");
const resumeShortLinks = process.argv.includes("--resume-short-links");
const resumeFloatingWhatsapp = process.argv.includes("--resume-floating-whatsapp");

/** @type {typeof CMS_LOGIN_PLAN_MIGRATIONS} */
let plan = CMS_LOGIN_PLAN_MIGRATIONS;
if (minOnly) {
  plan = [CMS_LOGIN_MIN_MIGRATION];
} else if (resumeFloatingWhatsapp) {
  plan = CMS_LOGIN_RESUME_FLOATING_WHATSAPP;
} else if (resumeShortLinks) {
  plan = CMS_LOGIN_RESUME_SHORT_LINKS;
} else if (resumePackages) {
  plan = CMS_LOGIN_RESUME_PACKAGES;
} else if (resumeBlog) {
  plan = CMS_LOGIN_RESUME_FROM_BLOG_HUB;
} else if (resume) {
  plan = CMS_LOGIN_RESUME_FROM_AGENCY;
}

const password = process.env.SUPABASE_CMS_DB_PASSWORD;
if (!password) {
  console.error(
    "Missing SUPABASE_CMS_DB_PASSWORD in .env — copy Database password from Supabase Dashboard → Project Settings → Database.",
  );
  process.exit(1);
}

const ref = cmsProjectRef();

function buildConnectionUrls() {
  const enc = encodeURIComponent(password);
  const regions = [
    "ap-southeast-1",
    "ap-south-1",
    "ap-northeast-1",
    "ap-southeast-2",
    "us-east-1",
    "eu-west-1",
  ];
  const urls = [`postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`];
  for (const region of regions) {
    urls.push(
      `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    );
    urls.push(
      `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    );
  }
  return urls;
}

async function connect() {
  const urls = buildConnectionUrls();
  let lastErr;
  for (const connectionString of urls) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 12_000,
    });
    try {
      await client.connect();
      await client.query("select 1");
      const host = connectionString.replace(/:[^:@/]+@/, ":***@");
      console.log("Connected:", host);
      return client;
    } catch (err) {
      lastErr = err;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw lastErr ?? new Error("Could not connect to CMS database");
}

function resolveMigrationPath(entry) {
  const item =
    typeof entry === "string"
      ? { file: entry, dir: "migrations" }
      : entry;
  const filePath = path.join(migrationsRoot, item.dir, item.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  return { filePath, label: `${item.dir}/${item.file}` };
}

async function applyFile(client, entry) {
  const { filePath, label } = resolveMigrationPath(entry);
  const sql = fs.readFileSync(filePath, "utf8");
  console.log(`\n>>> ${label} (${sql.length} bytes)`);
  await client.query(sql);
  console.log("    OK");
}

async function main() {
  console.log(`CMS project: ${ref}`);
  console.log(
    `Migrations: ${plan.length} file(s)${minOnly ? " (minimum)" : resumeFloatingWhatsapp ? " (floating-whatsapp)" : resumeShortLinks ? " (short-links)" : resumePackages ? " (packages)" : resumeBlog ? " (resume-blog)" : resume ? " (resume)" : ""}`,
  );

  const client = await connect();
  try {
    for (const entry of plan) {
      await applyFile(client, entry);
    }
    const { rows } = await client.query(
      `select exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = 'cms_admins'
       ) as cms_ok,
       exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = 'property_packages'
       ) as packages_ok,
       exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'marketing_short_links'
           and column_name = 'visitor_count'
       ) as short_links_ok,
       exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = 'home_floating_whatsapp_settings'
       ) as floating_wa_ok`,
    );
    if (!rows[0]?.cms_ok && !resumePackages && !resumeShortLinks && !resumeFloatingWhatsapp) {
      throw new Error("cms_admins table missing after migrations");
    }
    if (resumePackages && !rows[0]?.packages_ok) {
      throw new Error("property_packages table missing after packages migration");
    }
    if (resumeShortLinks && !rows[0]?.short_links_ok) {
      throw new Error("marketing_short_links.visitor_count missing after short-links migration");
    }
    if (resumeFloatingWhatsapp && !rows[0]?.floating_wa_ok) {
      throw new Error("home_floating_whatsapp_settings table missing after floating-whatsapp migration");
    }
    const doneMsg = resumeFloatingWhatsapp
      ? "home_floating_whatsapp_settings is present."
      : resumeShortLinks
        ? "marketing_short_links.visitor_count is present."
        : rows[0]?.packages_ok
          ? "property_packages is present."
          : "cms_admins table is present.";
    console.log("\nDone.", doneMsg);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message ?? err);
  process.exit(1);
});
