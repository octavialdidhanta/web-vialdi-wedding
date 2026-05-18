// @ts-nocheck
// supabase/functions/_shared/supabaseAdmin.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
function mustGetEnv(name) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// supabase/functions/_shared/cors.ts
function corsHeaders(origin) {
  const allowed = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const list = allowed.split(",").map((s) => s.trim()).filter(Boolean);
  const o = origin?.trim() ?? "";
  if (list.length === 0) {
    return { "access-control-allow-origin": "*" };
  }
  if (o && list.includes(o)) {
    return {
      "access-control-allow-origin": o,
      "access-control-allow-credentials": "true",
      Vary: "Origin"
    };
  }
  return {};
}
function corsPreflightHeaders(origin) {
  const h = {
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400"
  };
  const extra = corsHeaders(origin);
  for (const [k, v] of Object.entries(extra)) {
    h[k] = v;
  }
  return h;
}
function jsonResponse(data, init = {}, origin = null) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...init.headers ?? {}
    }
  });
}

// supabase/functions-src/contact-lead/index.ts
var CONTACT_DEFAULT_PACKAGE = "Konsultasi umum \u2014 halaman kontak";
var DEFAULT_WEB_ID = "vialdi-wedding";
var DEFAULT_FORM_ID = "contact-main";
function mapLegacyToHub(body) {
  const step = Number(body.step);
  const webId = typeof body.web_id === "string" && body.web_id.trim() || Deno.env.get("HUB_DEFAULT_WEB_ID") || DEFAULT_WEB_ID;
  const formId = typeof body.form_id === "string" && body.form_id.trim() || DEFAULT_FORM_ID;
  const form_data = {};
  if (step === 1) {
    if (typeof body.name === "string") form_data.name = body.name;
    if (typeof body.phone_number === "string") form_data.phone_number = body.phone_number;
    if (typeof body.email === "string") form_data.email = body.email;
  } else if (step === 2) {
    if (typeof body.industry === "string") form_data.industry = body.industry;
    if (typeof body.business_type === "string") form_data.business_type = body.business_type;
    if (typeof body.event_date === "string") form_data.event_date = body.event_date;
    if (typeof body.event_time === "string") form_data.event_time = body.event_time;
    if (typeof body.event_address === "string") form_data.event_address = body.event_address;
    if (body.consent === true) form_data.consent = true;
  } else if (step === 3) {
    if (typeof body.job_title === "string") form_data.job_title = body.job_title;
    if (typeof body.needs === "string") form_data.needs = body.needs;
    if (typeof body.office_address === "string") form_data.office_address = body.office_address;
  }
  if (body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data)) {
    Object.assign(form_data, body.form_data);
  }
  const out = {
    web_id: webId,
    form_id: formId,
    step,
    form_data
  };
  if (typeof body.id === "string" && body.id.trim()) out.id = body.id.trim();
  const pkg = body.package_label;
  if (typeof pkg === "string" && pkg.trim()) {
    out.package_label = pkg.trim();
  } else if (step === 1 && webId === "vialdi-wedding") {
    out.package_label = CONTACT_DEFAULT_PACKAGE;
  }
  if (body.attribution !== void 0) out.attribution = body.attribution;
  if (typeof body.analytics_session_id === "string") {
    out.analytics_session_id = body.analytics_session_id;
  }
  return out;
}
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsPreflightHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 }, origin);
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 }, origin);
  }
  const hubBody = mapLegacyToHub(body);
  let supabaseUrl;
  let serviceRoleKey;
  try {
    supabaseUrl = mustGetEnv("SUPABASE_URL").replace(/\/$/, "");
    serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e) {
    return jsonResponse({ error: e.message }, { status: 500 }, origin);
  }
  const auth = (req.headers.get("Authorization") ?? "").trim();
  const apikey = (req.headers.get("apikey") ?? "").trim();
  const res = await fetch(`${supabaseUrl}/functions/v1/contact-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.length > 0 ? auth : `Bearer ${serviceRoleKey}`,
      apikey: apikey.length > 0 ? apikey : serviceRoleKey
    },
    body: JSON.stringify(hubBody)
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
  }
  if (parsed && res.ok) {
    const submissionId = parsed.submission_id ?? parsed.id;
    const leadId = parsed.lead_id;
    if (submissionId) {
      return jsonResponse(
        { id: submissionId, lead_id: leadId, submission_id: submissionId },
        { status: res.status },
        origin
      );
    }
  }
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
});
