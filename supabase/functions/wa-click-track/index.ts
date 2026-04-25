/**
 * Supabase Edge Function: wa-click-track
 *
 * Persists explicit Floating WhatsApp click events (server-side) and sends an owner notification
 * via Meta WhatsApp Cloud API (template).
 *
 * Secrets used (recommended):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ALLOWED_ORIGINS (optional, comma-separated, same style as analytics-ingest)
 *
 * WhatsApp Cloud API (reuses same WABA credentials as lead functions):
 * - WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID (fallback jika tidak ada baris di `organization_whatsapp_accounts`)
 * - `public.organization_whatsapp_accounts`: phone_number_id per baris; dipilih via `display_phone_number` + `web_id` request
 * - WHATSAPP_GRAPH_VERSION (optional, default v21.0)
 *
 * Owner notification (new):
 * - WHATSAPP_OWNER_TO_E164 (e.g. +6281118891308)
 * - WHATSAPP_OWNER_TEMPLATE_NAME (e.g. wa_click_notify)
 * - WHATSAPP_OWNER_TEMPLATE_LANGUAGE (optional, default id)
 * - WHATSAPP_OWNER_TEMPLATE_BODY_KEYS (comma-separated keys, optional)
 * - WHATSAPP_OWNER_TEMPLATE_BODY_PARAMETER_NAMES (optional, for named parameters)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MAX_PATH_LEN = 512;
const MAX_URL_LEN = 2000;
const MAX_UTM_LEN = 200;
const MAX_LANDING_URL_LEN = 1000;

type Body = {
  session_id: string;
  web_id: string;
  path: string;
  target_url?: string | null;
  ua_hash?: string | null;
  attribution?: Record<string, unknown> | null;
  /** Optional client timestamp (ISO). Server also stores created_at. */
  ts?: string | null;
};

const ALLOWED_WEB_IDS = ["vialdi", "vialdi-wedding", "synckerja"] as const;

/** Sama dengan Edge Function lead lain — organisasi CRM utama. */
const ORG_ID = "663c9336-8cb6-4a36-9ad9-313126e70a1a";

function normalizeWebId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.length === 0 || s.length > 32) return null;
  if (!(ALLOWED_WEB_IDS as readonly string[]).includes(s)) return null;
  return s;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      ...(init.headers ?? {}),
    },
  });
}

function corsHeaders(origin: string | null): HeadersInit {
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
      Vary: "Origin",
    };
  }
  return {};
}

function corsPreflightHeaders(origin: string | null): HeadersInit {
  const h: Record<string, string> = {
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
  };
  const extra = corsHeaders(origin) as Record<string, string>;
  for (const [k, v] of Object.entries(extra)) {
    if (v != null && v !== "") h[k] = v;
  }
  return h;
}

function badRequest(message: string, origin: string | null) {
  return json({ error: message }, { status: 400, headers: corsHeaders(origin) });
}

function mustGetEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getEnvOptional(name: string) {
  const v = Deno.env.get(name);
  return v && v.trim().length ? v.trim() : null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function validPath(p: string): boolean {
  if (typeof p !== "string" || p.length === 0 || p.length > MAX_PATH_LEN) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("/admin")) return false;
  return true;
}

function clipText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

function toIpHash(ip: string): string {
  // Simple non-cryptographic hash (privacy-friendly). Avoid storing raw IP.
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  }
  return String(h);
}

const rateState = new Map<string, { minute: number; count: number }>();

function rateOk(ip: string): boolean {
  const minute = Math.floor(Date.now() / 60_000);
  const cur = rateState.get(ip);
  if (!cur || cur.minute !== minute) {
    rateState.set(ip, { minute, count: 1 });
    return true;
  }
  cur.count += 1;
  // A click-only endpoint; keep modest.
  return cur.count <= 120;
}

type OwnerTemplateConfig = {
  token: string;
  phoneNumberId: string;
  toE164: string;
  templateName: string;
  language: string;
  graphVersion: string;
  bodyKeys: string[];
  bodyParamNames: string[] | null;
};

function waToDigitsForGraphApi(e164: string) {
  return e164.replace(/^\+/, "").replace(/[^\d]/g, "");
}

function parseCsvList(raw: string | null): string[] {
  if (!raw) return [];
  if (/^__none__$/i.test(raw.trim())) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const WA_ORG_LINE_DIGITS: Record<string, string> = {
  vialdi: "6281118891308",
  "vialdi-wedding": "6281281714855",
};

function digitsOnly(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/\D/g, "");
}

function normalizeIndonesiaMarketingDigits(raw: string): string {
  const d = digitsOnly(raw);
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.startsWith("8")) return `62${d}`;
  return d;
}

function pickPhoneNumberIdFromAccountRow(row: Record<string, unknown>): string {
  for (const k of ["phone_number_id", "whatsapp_phone_number_id", "meta_phone_number_id"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function orgWhatsappRowIsActive(row: Record<string, unknown>): boolean {
  const a = row["is_active"];
  return a === null || a === undefined || a === true;
}

async function resolveWhatsappPhoneNumberIdFromOrgTable(
  admin: ReturnType<typeof createClient>,
  organizationId: string,
  webId: string,
): Promise<string | null> {
  const wid = String(webId).trim();
  const targetDigits = wid ? WA_ORG_LINE_DIGITS[wid] : null;
  if (!targetDigits) return null;

  try {
    const { data: rows, error } = await admin
      .from("organization_whatsapp_accounts")
      .select("phone_number_id, display_phone_number, is_active")
      .eq("organization_id", organizationId);
    if (error) {
      console.warn("wa-click-track: organization_whatsapp_accounts lookup failed", error.message);
      return null;
    }
    if (!Array.isArray(rows)) return null;
    for (const raw of rows) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row = raw as Record<string, unknown>;
      if (!orgWhatsappRowIsActive(row)) continue;
      const disp = normalizeIndonesiaMarketingDigits(String(row["display_phone_number"] ?? ""));
      const pid = pickPhoneNumberIdFromAccountRow(row);
      if (!pid || !disp) continue;
      if (disp === targetDigits) return pid;
    }
  } catch (e) {
    console.warn("wa-click-track: organization_whatsapp_accounts exception", e);
  }
  return null;
}

function parseOwnerTemplateConfig(graphPhoneNumberId: string | null): OwnerTemplateConfig | null {
  const token = getEnvOptional("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = (graphPhoneNumberId?.trim() || getEnvOptional("WHATSAPP_PHONE_NUMBER_ID") || "").trim();
  const toE164 = getEnvOptional("WHATSAPP_OWNER_TO_E164");
  const templateName =
    getEnvOptional("WHATSAPP_OWNER_TEMPLATE_NAME") ?? getEnvOptional("WHATSAPP_TEMPLATE_NAME");

  if (!token || !phoneNumberId || !toE164 || !templateName) {
    return null;
  }

  const language =
    getEnvOptional("WHATSAPP_OWNER_TEMPLATE_LANGUAGE") ??
    getEnvOptional("WHATSAPP_TEMPLATE_LANGUAGE") ??
    "id";
  const graphVersion = getEnvOptional("WHATSAPP_GRAPH_VERSION") ?? "v21.0";
  const bodyKeys = parseCsvList(
    getEnvOptional("WHATSAPP_OWNER_TEMPLATE_BODY_KEYS") ?? getEnvOptional("WHATSAPP_TEMPLATE_BODY_KEYS"),
  );
  const bodyParamNamesRaw = parseCsvList(
    getEnvOptional("WHATSAPP_OWNER_TEMPLATE_BODY_PARAMETER_NAMES") ??
      getEnvOptional("WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES"),
  );
  const bodyParamNames = bodyParamNamesRaw.length === bodyKeys.length ? bodyParamNamesRaw : null;

  return {
    token,
    phoneNumberId,
    toE164,
    templateName,
    language,
    graphVersion,
    bodyKeys,
    bodyParamNames,
  };
}

function extractAttributionForDb(raw: Record<string, unknown> | null | undefined): Record<string, string> {
  const obj = raw && typeof raw === "object" ? raw : null;
  const allow = new Set([
    "landing_url",
    "referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "meta_campaign_name",
    "meta_adset_name",
    "meta_ad_name",
    "has_gclid",
    "has_fbclid",
    "has_msclkid",
    "has_gbraid",
    "has_wbraid",
  ]);
  const out: Record<string, string> = {};
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) {
    if (!allow.has(k)) continue;
    if (typeof v === "boolean") {
      if (v) out[k] = "true";
      continue;
    }
    if (typeof v !== "string") continue;
    const max = k === "landing_url" ? MAX_LANDING_URL_LEN : MAX_UTM_LEN;
    const clipped = clipText(v, max);
    if (clipped) out[k] = clipped;
  }
  return out;
}

function ownerTemplateCtxFromBody(body: Body): Record<string, string> {
  const a = (body.attribution ?? {}) as Record<string, unknown>;
  const s = (x: unknown, max: number) => clipText(x, max);
  const utmSource = s(a["utm_source"], 200);
  const utmMedium = s(a["utm_medium"], 200);
  const utmCampaign = s(a["utm_campaign"], 200);
  const landingUrl = s(a["landing_url"], 300);
  const path = s(body.path, 200);

  // Compatibility fields for existing lead templates (e.g. elementorform) if reused for owner notify.
  const compatNeeds = [utmSource && `source=${utmSource}`, utmMedium && `medium=${utmMedium}`, utmCampaign && `campaign=${utmCampaign}`]
    .filter(Boolean)
    .join(" | ");

  return {
    web_id: s(body.web_id, 32),
    path,
    target_url: s(body.target_url ?? "", 300),
    landing_url: landingUrl,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: s(a["utm_content"], 200),
    utm_term: s(a["utm_term"], 200),
    meta_campaign_name: s(a["meta_campaign_name"], 200),
    meta_adset_name: s(a["meta_adset_name"], 200),
    meta_ad_name: s(a["meta_ad_name"], 200),
    session_id: s(body.session_id, 36),
    ts: s(body.ts ?? new Date().toISOString(), 32),

    // Common keys used by existing customer template(s)
    name: "WA Click (Tracking)",
    phone_number: "",
    email: "",
    needs: compatNeeds || "Klik tombol WhatsApp",
    job_title: `Path: ${path}`.slice(0, 120),
    industry: utmCampaign || utmSource || "Website",
    business_type: "B2C",
  };
}

async function sendOwnerTemplate(config: OwnerTemplateConfig, ctx: Record<string, string>) {
  const toDigits = waToDigitsForGraphApi(config.toE164);
  if (!toDigits) {
    return { ok: false as const, error: "Invalid WHATSAPP_OWNER_TO_E164" };
  }

  const parameters = config.bodyKeys.map((k, i) => {
    const text = (ctx[k] ?? "").trim().slice(0, 1024) || "—";
    const p: Record<string, unknown> = { type: "text", text };
    if (config.bodyParamNames?.[i]) {
      p.parameter_name = config.bodyParamNames[i];
    }
    return p;
  });

  const template: Record<string, unknown> = {
    name: config.templateName,
    language: { code: config.language },
  };
  if (parameters.length > 0) {
    template.components = [{ type: "body", parameters }];
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "template",
      template,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("wa-click-track: owner WhatsApp notify failed", {
      status: res.status,
      template: config.templateName,
      preview: text.slice(0, 400),
    });
    return { ok: false as const, error: `WhatsApp API error (${res.status}): ${text.slice(0, 500)}` };
  }
  return { ok: true as const };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsPreflightHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders(origin) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateOk(ip)) {
    return json({ error: "rate limit" }, { status: 429, headers: corsHeaders(origin) });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return badRequest("Invalid JSON", origin);
  }

  if (!body?.session_id || !isUuid(body.session_id)) {
    return badRequest("Invalid session_id", origin);
  }
  const webId = normalizeWebId(body.web_id);
  if (!webId) {
    return badRequest("Invalid web_id", origin);
  }
  if (!validPath(body.path)) {
    return badRequest("Invalid path", origin);
  }
  const targetUrl = body.target_url ? clipText(body.target_url, MAX_URL_LEN) : "";
  const uaHash = body.ua_hash ? clipText(body.ua_hash, 64) : "";

  let supabaseUrl: string;
  let serviceRoleKey: string;
  try {
    supabaseUrl = mustGetEnv("SUPABASE_URL");
    serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders(origin) });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const graphPhoneNumberId = await resolveWhatsappPhoneNumberIdFromOrgTable(admin, ORG_ID, webId);

  const attribution = extractAttributionForDb(body.attribution ?? null);
  const ipHash = ip !== "unknown" ? toIpHash(ip) : null;

  const { error: insErr } = await admin.from("analytics_wa_clicks").insert({
    web_id: webId,
    session_id: body.session_id,
    path: body.path,
    target_url: targetUrl || null,
    attribution: Object.keys(attribution).length ? attribution : null,
    ua_hash: uaHash || null,
    ip_hash: ipHash,
  });

  if (insErr) {
    console.error("wa-click-track: insert failed", insErr);
    return json({ error: "persist failed" }, { status: 500, headers: corsHeaders(origin) });
  }

  // Optional owner notification
  const cfg = parseOwnerTemplateConfig(graphPhoneNumberId);
  let owner_notify: { ok: boolean; skipped?: boolean; error?: string } = { ok: true, skipped: true };
  if (cfg) {
    const ctx = ownerTemplateCtxFromBody({
      ...body,
      web_id: webId,
      target_url: targetUrl || null,
      ua_hash: uaHash || null,
    });
    const sent = await sendOwnerTemplate(cfg, ctx);
    owner_notify = sent.ok ? { ok: true } : { ok: false, error: sent.error };
  }

  return json(
    { ok: true, owner_notify },
    {
      headers: corsHeaders(origin),
    },
  );
});

