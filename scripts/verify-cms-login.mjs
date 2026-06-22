/**
 * Smoke test: sign in + cms_admins allowlist check (same as AdminLoginPage flow).
 *
 *   npm run cms:verify-login
 */
import { createClient } from "@supabase/supabase-js";
import { loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_ADMIN_EMAIL;
const password = process.env.CMS_ADMIN_PASSWORD;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}
if (!email || !password) {
  console.error("Set CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    throw new Error(`signInWithPassword: ${signInErr.message}`);
  }
  console.log("Auth OK — user", signIn.user?.id);

  const { data: row, error: adminErr } = await supabase
    .from("cms_admins")
    .select("user_id")
    .eq("user_id", signIn.user.id)
    .maybeSingle();
  if (adminErr) throw adminErr;
  if (!row) {
    throw new Error("cms_admins: no row for this user (would redirect to /admin/forbidden)");
  }
  console.log("cms_admins OK — isAdmin = true");
  console.log("\nLogin verification passed.");
}

main().catch((err) => {
  console.error("\nVerify failed:", err.message ?? err);
  process.exit(1);
});
