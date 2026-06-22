/**
 * Smoke test property_packages (admin list + insert + delete).
 *   npm run cms:verify-packages
 */
import { createClient } from "@supabase/supabase-js";
import { loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_ADMIN_EMAIL;
const password = process.env.CMS_ADMIN_PASSWORD;
const webId = process.env.VITE_CMS_PROPERTY_SLUG ?? process.env.VITE_WEB_ID ?? "vialdi-wedding";

if (!url || !anonKey || !email || !password) {
  console.error("Need VITE_SUPABASE_*, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw signInErr;

  const { data: list, error: listErr } = await supabase
    .from("property_packages")
    .select("id")
    .eq("web_id", webId)
    .limit(1);
  if (listErr) throw listErr;
  console.log("LIST OK — rows:", list?.length ?? 0);

  const slug = `verify-${Date.now()}`;
  const { data: inserted, error: insertErr } = await supabase
    .from("property_packages")
    .insert({
      web_id: webId,
      slug,
      sort_order: 0,
      is_published: false,
      badge_label: "Test",
      title: "Verify package",
      package_label: "Verify",
      price: "0",
      sections: [],
      updated_by: signIn.user.id,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  console.log("INSERT OK — id:", inserted.id);

  const { error: delErr } = await supabase
    .from("property_packages")
    .delete()
    .eq("web_id", webId)
    .eq("id", inserted.id);
  if (delErr) throw delErr;
  console.log("DELETE OK");

  console.log("\nproperty_packages verification passed.");
}

main().catch((err) => {
  console.error("\nVerify failed:", err.message ?? err);
  process.exit(1);
});
