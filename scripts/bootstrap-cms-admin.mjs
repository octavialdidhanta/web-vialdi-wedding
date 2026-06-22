/**
 * Create first CMS admin: Auth user + row in public.cms_admins.
 *
 * Requires in .env:
 *   SUPABASE_CMS_SERVICE_ROLE_KEY
 *   CMS_ADMIN_EMAIL
 *   CMS_ADMIN_PASSWORD
 *
 *   npm run cms:bootstrap-admin
 */
import { createClient } from "@supabase/supabase-js";
import { cmsProjectRef, loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_CMS_SERVICE_ROLE_KEY;
const email = process.env.CMS_ADMIN_EMAIL;
const password = process.env.CMS_ADMIN_PASSWORD;

if (!url) {
  console.error("Missing VITE_SUPABASE_URL in .env");
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    "Missing SUPABASE_CMS_SERVICE_ROLE_KEY — copy service_role key from Dashboard → Settings → API.",
  );
  process.exit(1);
}
if (!email || !password) {
  console.error("Set CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD in .env for the first admin account.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  console.log(`CMS: ${cmsProjectRef()}`);
  console.log(`Admin email: ${email}`);

  let user = await findUserByEmail();
  if (user) {
    console.log(`Auth user already exists: ${user.id}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created Auth user: ${user.id}`);
  }

  const { data: existing, error: selectErr } = await admin
    .from("cms_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selectErr) {
    if (selectErr.code === "PGRST205") {
      throw new Error("cms_admins table missing — run npm run cms:migrate first");
    }
    throw selectErr;
  }

  if (existing) {
    console.log("cms_admins row already exists — nothing to insert.");
  } else {
    const { error: insertErr } = await admin.from("cms_admins").insert({ user_id: user.id });
    if (insertErr) throw insertErr;
    console.log("Inserted cms_admins allowlist row.");
  }

  console.log("\nBootstrap complete. Test login at /admin/login");
}

main().catch((err) => {
  console.error("\nBootstrap failed:", err.message ?? err);
  process.exit(1);
});
