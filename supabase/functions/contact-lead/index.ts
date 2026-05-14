/**
 * Edge `contact-lead` — situs ini **Vialdi Wedding** saja: tidak lagi menulis ke `public.leads_vialdiid`.
 * Permintaan diteruskan ke `wedding-package-lead` (staging `leads_vialdi_wedding` + CRM `leads`).
 *
 * Untuk langkah 1 tanpa `package_label`, server mengisi default konsultasi halaman kontak agar kompatibel
 * dengan validasi `wedding-package-lead`.
 */

function mustGetEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      ...(init.headers ?? {}),
    },
  });
}

const CONTACT_DEFAULT_PACKAGE = "Konsultasi umum — halaman kontak";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const step = body.step;
  const pkg = body.package_label;
  if (step === 1 && (typeof pkg !== "string" || !String(pkg).trim())) {
    body = { ...body, package_label: CONTACT_DEFAULT_PACKAGE };
  }

  let supabaseUrl: string;
  let serviceRoleKey: string;
  try {
    supabaseUrl = mustGetEnv("SUPABASE_URL").replace(/\/$/, "");
    serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500 });
  }

  const auth = (req.headers.get("Authorization") ?? "").trim();
  const apikey = (req.headers.get("apikey") ?? "").trim();

  const res = await fetch(`${supabaseUrl}/functions/v1/wedding-package-lead`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.length > 0 ? auth : `Bearer ${serviceRoleKey}`,
      apikey: apikey.length > 0 ? apikey : serviceRoleKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
});
