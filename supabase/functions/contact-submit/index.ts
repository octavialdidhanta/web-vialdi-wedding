// @ts-nocheck
// supabase/functions/_shared/attribution.ts
var LEAD_UTM_MAX = 200;
var LEAD_URL_MAX = 2e3;
var LEAD_ALLOWED_KEYS = [
  "landing_url",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
];
function leadClip(s, max) {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}
function maxForKey(key) {
  if (key === "landing_url" || key === "referrer") return LEAD_URL_MAX;
  return LEAD_UTM_MAX;
}
function computeAttributionLabel(a) {
  const campaign = a.utm_campaign?.trim();
  const src = a.utm_source?.trim();
  const med = a.utm_medium?.trim();
  if (campaign) {
    const tail = [src, med].filter(Boolean).join(" / ");
    return tail ? `${campaign} (${tail})`.slice(0, 500) : campaign.slice(0, 500);
  }
  if (src || med) return [src, med].filter(Boolean).join(" / ").slice(0, 500);
  const land = a.landing_url?.trim();
  if (land) return `Landing: ${land.length > 120 ? land.slice(0, 117) + "..." : land}`.slice(0, 500);
  const ref = a.referrer?.trim();
  if (ref) return `Referrer: ${ref.length > 100 ? ref.slice(0, 97) + "..." : ref}`.slice(0, 500);
  return "Direct / unknown";
}
function parseLeadAttribution(raw) {
  if (raw === void 0 || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw;
  const out = {
    landing_url: null,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null
  };
  for (const key of LEAD_ALLOWED_KEYS) {
    const v = obj[key];
    if (v === void 0 || v === null) continue;
    if (typeof v !== "string") return null;
    const clipped = leadClip(v, maxForKey(key));
    out[key] = clipped.length > 0 ? clipped : null;
  }
  const hasAny = LEAD_ALLOWED_KEYS.some((k) => out[k] != null && out[k] !== "");
  if (!hasAny) return null;
  return { attribution: out, label: computeAttributionLabel(out) };
}
function attributionToJsonb(a) {
  const o = {};
  for (const k of LEAD_ALLOWED_KEYS) {
    const v = a[k];
    if (v != null && v !== "") o[k] = v;
  }
  return o;
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

// supabase/functions/_shared/propertyCreatedByName.ts
function propertyCreatedByName(displayName, webId) {
  const fromDisplay = typeof displayName === "string" ? displayName.trim() : "";
  if (fromDisplay) return fromDisplay.slice(0, 200);
  const slug = typeof webId === "string" ? webId.trim() : "";
  if (slug) {
    return slug.split(/[-_]+/).filter((p) => p.length > 0).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ").slice(0, 200);
  }
  return "Website";
}

// supabase/functions/_shared/crmLeadSync.ts
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isIsoDateOnly(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}
function buildLegacyWeddingFunnelKey(webId, identityHash) {
  return `wedding-package-lead:${webId}:package:${identityHash.slice(0, 16)}`.slice(0, 200);
}
function buildFunnelKey(webId, formId, identityHash) {
  if (webId === "vialdi-wedding" && formId === "contact-main") {
    return buildLegacyWeddingFunnelKey(webId, identityHash);
  }
  return `contact-submit:${webId}:${formId}:${identityHash.slice(0, 16)}`.slice(0, 200);
}
async function syncCrmLeadStep1(args) {
  const identityHash = await sha256Hex(`${args.phone_number}|${args.email.toLowerCase()}`);
  const funnel_key = buildFunnelKey(args.webId, args.formId, identityHash);
  const title = args.package_label?.trim() || `Kontak \u2014 ${args.webId}`;
  const category = args.webId === "vialdi-wedding" && args.formId === "contact-main" ? "Wedding package card" : "Contact Form";
  const { data: lead, error: leadErr } = await args.admin.from("leads").upsert(
    {
      client: args.name,
      title,
      category,
      created_by: args.systemUserId,
      created_by_name: propertyCreatedByName(args.propertyDisplayName, args.webId),
      assignee: "",
      followup: 0,
      organization_id: args.organizationId,
      phone_number: args.phone_number,
      email: args.email,
      source: args.webId === "vialdi-wedding" && args.formId === "contact-main" ? "Wedding package card" : `Hub ${args.webId}`,
      services: args.package_label ?? "",
      web_id: args.webId,
      funnel_key,
      ...args.analytics_session_id ? { analytics_session_id: args.analytics_session_id } : {},
      ...args.attribution ? { attribution: args.attribution } : {},
      ...args.attribution_label ? { attribution_label: args.attribution_label } : {}
    },
    { onConflict: "organization_id,dedupe_key" }
  ).select("id").single();
  if (leadErr || !lead?.id) {
    return { ok: false, error: leadErr?.message ?? "Failed to upsert lead" };
  }
  const leadId = String(lead.id);
  const { error: profileErr } = await args.admin.from("lead_client_profiles").insert({
    lead_id: leadId,
    name: args.name,
    organization_id: args.organizationId,
    created_by: args.systemUserId,
    contact_person: args.name,
    contact_email: args.email,
    contact_phone: args.phone_number,
    phone_number: args.phone_number,
    email: args.email
  });
  if (profileErr) {
    const code = profileErr?.code;
    const dup = code === "23505" || /duplicate key|unique constraint/i.test(profileErr.message);
    if (!dup) return { ok: false, error: profileErr.message };
  }
  return { ok: true, leadId, identityHash };
}
async function patchCrmLeadFromStep1(args) {
  const identityHash = await sha256Hex(`${args.phone_number}|${args.email.toLowerCase()}`);
  const funnel_key = buildFunnelKey(args.webId, args.formId, identityHash);
  const title = args.package_label?.trim() || `Kontak \u2014 ${args.webId}`;
  const category = args.webId === "vialdi-wedding" && args.formId === "contact-main" ? "Wedding package card" : "Contact Form";
  const patch = {
    client: args.name,
    title,
    category,
    phone_number: args.phone_number,
    email: args.email,
    funnel_key,
    source: args.webId === "vialdi-wedding" && args.formId === "contact-main" ? "Wedding package card" : `Hub ${args.webId}`,
    services: args.package_label ?? "",
    web_id: args.webId,
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...args.analytics_session_id ? { analytics_session_id: args.analytics_session_id } : {},
    ...args.attribution ? { attribution: args.attribution } : {},
    ...args.attribution_label ? { attribution_label: args.attribution_label } : {}
  };
  const { error: leadErr } = await args.admin.from("leads").update(patch).eq("id", args.leadId).eq("organization_id", args.organizationId);
  if (leadErr) return { ok: false, error: leadErr.message };
  const { error: profileErr } = await args.admin.from("lead_client_profiles").insert({
    lead_id: args.leadId,
    name: args.name,
    organization_id: args.organizationId,
    created_by: args.systemUserId,
    contact_person: args.name,
    contact_email: args.email,
    contact_phone: args.phone_number,
    phone_number: args.phone_number,
    email: args.email
  });
  if (profileErr) {
    const code = profileErr?.code;
    const dup = code === "23505" || /duplicate key|unique constraint/i.test(profileErr.message);
    if (dup) {
      const { error: upErr } = await args.admin.from("lead_client_profiles").update({
        name: args.name,
        contact_person: args.name,
        contact_email: args.email,
        contact_phone: args.phone_number,
        phone_number: args.phone_number,
        email: args.email
      }).eq("lead_id", args.leadId);
      if (upErr) return { ok: false, error: upErr.message };
    } else {
      return { ok: false, error: profileErr.message };
    }
  }
  return { ok: true, identityHash };
}
async function updateCrmLeadFromSubmission(args) {
  const patch = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (args.attribution) patch.attribution = args.attribution;
  if (args.attribution_label) patch.attribution_label = args.attribution_label;
  if (args.analytics_session_id) patch.analytics_session_id = args.analytics_session_id;
  const isWedding = args.webId === "vialdi-wedding" && args.formId === "contact-main";
  const pkg = (args.package_label ?? "").trim();
  const eventDate = typeof args.mergedFormData.event_date === "string" && isIsoDateOnly(args.mergedFormData.event_date) ? args.mergedFormData.event_date.trim() : "";
  const eventTime = String(args.mergedFormData.event_time ?? "").trim();
  const eventAddress = String(args.mergedFormData.event_address ?? "").trim();
  if (isWedding) {
    patch.services = `${pkg} \u2014 tanggal ${eventDate}, jam ${eventTime}`;
  } else if (args.package_label) {
    patch.services = args.package_label;
  }
  const { error } = await args.admin.from("leads").update(patch).eq("id", args.leadId).eq("organization_id", args.organizationId);
  if (error) return { ok: false, error: error.message };
  if (isWedding) {
    const notesBlock = `Paket: ${pkg}
Tanggal acara: ${eventDate}
Jam acara: ${eventTime}
Alamat lengkap:
${eventAddress}`;
    const { error: profileErr } = await args.admin.from("lead_client_profiles").update({
      occupation: `Acara: ${eventDate} (${eventTime})`,
      notes: notesBlock
    }).eq("lead_id", args.leadId);
    if (profileErr) {
      console.warn("updateCrmLeadFromSubmission: lead_client_profiles update failed", profileErr.message);
    }
  }
  return { ok: true };
}

// supabase/functions/_shared/whatsappHub.ts
var ORG_WHATSAPP_TEMPLATE_ID = "06043eb4-e183-4c55-a9a3-89ec389bbd62";
function normalizePhoneE164(v) {
  const trimmed = v.trim();
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (compact.startsWith("+")) {
    const digits2 = compact.slice(1).replace(/[^\d]/g, "");
    return `+${digits2}`;
  }
  const digitsOnly2 = compact.replace(/[^\d]/g, "");
  if (/^(0?8\d{8,13})$/.test(digitsOnly2)) {
    const national = digitsOnly2.startsWith("0") ? digitsOnly2.slice(1) : digitsOnly2;
    return `+62${national}`;
  }
  const digits = compact.replace(/[^\d]/g, "");
  return digits.length ? `+${digits}` : "";
}
var WA_ORG_LINE_DIGITS = {
  "vialdi-wedding": "6281281714855"
};
function digitsOnly(s) {
  if (typeof s !== "string") return "";
  return s.replace(/\D/g, "");
}
function normalizeIndonesiaMarketingDigits(raw) {
  const d = digitsOnly(raw);
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.startsWith("8")) return `62${d}`;
  return d;
}
function pickPhoneNumberIdFromAccountRow(row) {
  for (const k of ["phone_number_id", "whatsapp_phone_number_id", "meta_phone_number_id"]) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}
function orgWhatsappRowIsActive(row) {
  const a = row["is_active"];
  return a === null || a === void 0 || a === true;
}
async function resolveWhatsappPhoneNumberIdFromOrgTable(admin, organizationId, webId) {
  const wid = webId && String(webId).trim() ? String(webId).trim() : null;
  const targetDigits = wid ? WA_ORG_LINE_DIGITS[wid] : null;
  if (!targetDigits) return null;
  try {
    const { data: rows, error } = await admin.from("organization_whatsapp_accounts").select("phone_number_id, display_phone_number, is_active").eq("organization_id", organizationId);
    if (error) {
      console.warn("contact-submit: organization_whatsapp_accounts lookup failed", error.message);
      return null;
    }
    if (!Array.isArray(rows)) return null;
    for (const raw of rows) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row = raw;
      if (!orgWhatsappRowIsActive(row)) continue;
      const disp = normalizeIndonesiaMarketingDigits(String(row["display_phone_number"] ?? ""));
      const pid = pickPhoneNumberIdFromAccountRow(row);
      if (!pid || !disp) continue;
      if (disp === targetDigits) return pid;
    }
  } catch (e) {
    console.warn("contact-submit: organization_whatsapp_accounts exception", e);
  }
  return null;
}
function getEnvOptional(name) {
  const v = Deno.env.get(name);
  return v && v.trim().length ? v.trim() : null;
}
function webIdToEnvSuffix(webId) {
  return webId.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function getWhatsappTemplateEnvForWeb(baseName, webId) {
  const wid = webId && String(webId).trim() ? String(webId).trim() : null;
  if (!wid) return getEnvOptional(baseName);
  const suffix = webIdToEnvSuffix(wid);
  if (!suffix) return getEnvOptional(baseName);
  const specific = getEnvOptional(`${baseName}__${suffix}`);
  if (specific) return specific;
  return getEnvOptional(baseName);
}
function resolveWhatsappTemplateEnv(webId) {
  const name = getWhatsappTemplateEnvForWeb("WHATSAPP_TEMPLATE_NAME", webId) ?? "hello_world";
  const lang = getWhatsappTemplateEnvForWeb("WHATSAPP_TEMPLATE_LANGUAGE", webId) ?? "en_US";
  return {
    templateName: name.trim(),
    templateLanguage: lang.trim(),
    bodyKeysRaw: getWhatsappTemplateEnvForWeb("WHATSAPP_TEMPLATE_BODY_KEYS", webId),
    parameterNamesRaw: getWhatsappTemplateEnvForWeb("WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES", webId),
    componentsJsonRaw: getWhatsappTemplateEnvForWeb("WHATSAPP_TEMPLATE_COMPONENTS_JSON", webId)
  };
}
function mergeResolvedWhatsappTemplateEnv(db, env) {
  if (!db) return env;
  const pick = (dbVal, fallback) => {
    const t = typeof dbVal === "string" ? dbVal.trim() : "";
    return t.length > 0 ? t : fallback;
  };
  const pickNull = (dbVal, fallback) => {
    if (dbVal === void 0 || dbVal === null) return fallback;
    const t = String(dbVal).trim();
    return t.length > 0 ? t : fallback;
  };
  return {
    templateName: pick(db.templateName, env.templateName),
    templateLanguage: pick(db.templateLanguage, env.templateLanguage),
    bodyKeysRaw: pickNull(db.bodyKeysRaw, env.bodyKeysRaw),
    parameterNamesRaw: pickNull(db.parameterNamesRaw, env.parameterNamesRaw),
    componentsJsonRaw: pickNull(db.componentsJsonRaw, env.componentsJsonRaw)
  };
}
async function loadOrganizationWhatsappTemplateFromDb(admin, organizationId, webId) {
  try {
    const fixed = await admin.from("organization_whatsapp_templates").select("template_name,template_language,body_keys,body_parameter_names,components_json").eq("organization_id", organizationId).eq("id", ORG_WHATSAPP_TEMPLATE_ID).eq("is_active", true).maybeSingle();
    let data = fixed.data;
    let error = fixed.error;
    if (!data && !error) {
      const byWeb = await admin.from("organization_whatsapp_templates").select("template_name,template_language,body_keys,body_parameter_names,components_json").eq("organization_id", organizationId).eq("web_id", webId).eq("is_active", true).maybeSingle();
      data = byWeb.data;
      error = byWeb.error;
    }
    if (error) {
      console.warn("contact-submit: organization_whatsapp_templates read failed", error.message);
      return null;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const d = data;
    const out = {};
    if (typeof d.template_name === "string" && d.template_name.trim()) out.templateName = d.template_name.trim();
    if (typeof d.template_language === "string" && d.template_language.trim()) {
      out.templateLanguage = d.template_language.trim();
    }
    if (typeof d.body_keys === "string" && d.body_keys.trim()) out.bodyKeysRaw = d.body_keys.trim();
    if (typeof d.body_parameter_names === "string" && d.body_parameter_names.trim()) {
      out.parameterNamesRaw = d.body_parameter_names.trim();
    }
    if (typeof d.components_json === "string" && d.components_json.trim()) {
      out.componentsJsonRaw = d.components_json.trim();
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch (e) {
    console.warn("contact-submit: organization_whatsapp_templates exception", e);
    return null;
  }
}
async function resolveWhatsappTemplateEnvWithDb(admin, organizationId, webId) {
  const env = resolveWhatsappTemplateEnv(webId);
  const org = organizationId?.trim();
  const wid = webId?.trim();
  if (!admin || !org || !wid) return env;
  const partial = await loadOrganizationWhatsappTemplateFromDb(admin, org, wid);
  return mergeResolvedWhatsappTemplateEnv(partial, env);
}
function parseTemplateBodyKeysFromResolved(resolved) {
  const raw = resolved.bodyKeysRaw;
  if (!raw) {
    const name = resolved.templateName.trim().toLowerCase();
    if (name === "hello_world") return [];
    return ["name", "name", "event_date", "event_time", "package_label"];
  }
  if (/^__none__$/i.test(raw.trim())) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function safeJsonParseArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function interpolateTemplateString(input, ctx) {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const v = ctx[String(key)];
    return nonEmptyTemplateParamText(typeof v === "string" ? v : "");
  });
}
function deepInterpolateTemplateJson(value, ctx) {
  if (typeof value === "string") return interpolateTemplateString(value, ctx);
  if (Array.isArray(value)) return value.map((v) => deepInterpolateTemplateJson(v, ctx));
  if (value && typeof value === "object") {
    const obj = value;
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = deepInterpolateTemplateJson(v, ctx);
    return out;
  }
  return value;
}
function buildWhatsappTemplateComponentsFromEnv(ctx, resolved) {
  const raw = resolved.componentsJsonRaw;
  if (!raw) return null;
  if (/^__none__$/i.test(raw.trim())) return [];
  const arr = safeJsonParseArray(raw);
  if (!arr) {
    console.warn("contact-submit: invalid WHATSAPP_TEMPLATE_COMPONENTS_JSON (not a JSON array)");
    return null;
  }
  const interpolated = deepInterpolateTemplateJson(arr, ctx);
  if (!Array.isArray(interpolated)) return null;
  const out = [];
  for (const item of interpolated) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item;
    if (typeof obj.type !== "string" || !obj.type.trim()) continue;
    out.push(obj);
  }
  return out;
}
function parseTemplateBodyParameterNamesFromResolved(expectedCount, resolved) {
  const raw = resolved.parameterNamesRaw;
  if (!raw) return null;
  const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (names.length !== expectedCount) {
    console.warn(
      `contact-submit: WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES count (${names.length}) != KEYS (${expectedCount}) \u2014 pakai format posisional`
    );
    return null;
  }
  return names;
}
function nonEmptyTemplateParamText(value) {
  const t = value.trim().slice(0, 1024);
  return t.length > 0 ? t : "\u2014";
}
function getLeadField(ctx, key) {
  const v = ctx[key];
  return typeof v === "string" ? v : "";
}
function waToDigitsForGraphApi(e164) {
  return e164.replace(/^\+/, "").replace(/[^\d]/g, "");
}
function extractWaMessageIdFromGraphResponse(parsed) {
  if (!parsed || typeof parsed !== "object") return void 0;
  const root = parsed;
  const messages = root.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const first = messages[0];
    if (first && typeof first === "object") {
      const id = first.id;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
  }
  const message = root.message;
  if (message && typeof message === "object") {
    const id = message.id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return void 0;
}
function extractWaMessageIdFromRawText(text) {
  const quoted = text.match(/"id"\s*:\s*"(wamid\.[^"]+)"/);
  if (quoted?.[1]) return quoted[1];
  const loose = text.match(/(wamid\.[A-Za-z0-9+/=_-]{12,})/);
  if (loose?.[1]) return loose[1];
  return void 0;
}
function formatTemplateMessageBody(args) {
  const lines = args.keys.map((k) => {
    const v = getLeadField(args.ctx, k).trim();
    return v ? `${k}: ${v}` : "";
  }).filter(Boolean);
  const header = `[Template: ${args.templateName}]`;
  const body = lines.length ? `${header}
${lines.join("\n")}` : header;
  return body.slice(0, 8e3);
}
async function sendWhatsappTemplateToClient(args) {
  const resolved = await resolveWhatsappTemplateEnvWithDb(
    args.admin ?? null,
    args.organizationId ?? null,
    args.webId ?? null
  );
  const token = getEnvOptional("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = (args.graphPhoneNumberId?.trim() || getEnvOptional("WHATSAPP_PHONE_NUMBER_ID") || "").trim();
  const templateName = resolved.templateName;
  const templateLanguage = resolved.templateLanguage;
  const graphVersion = getEnvOptional("WHATSAPP_GRAPH_VERSION") ?? "v21.0";
  if (!token || !phoneNumberId) {
    const skip_reason = !token && !phoneNumberId ? "missing_WHATSAPP_ACCESS_TOKEN_and_WHATSAPP_PHONE_NUMBER_ID_or_org_whatsapp_account" : !token ? "missing_WHATSAPP_ACCESS_TOKEN" : "missing_WHATSAPP_PHONE_NUMBER_ID_or_org_whatsapp_account";
    console.warn(`contact-submit: WhatsApp API not called \u2014 ${skip_reason}`);
    return { ok: true, skipped: true, skip_reason };
  }
  const toDigits = waToDigitsForGraphApi(args.toE164);
  if (!toDigits) {
    return { ok: false, error: "Invalid phone for WhatsApp (empty after normalization)" };
  }
  const keys = parseTemplateBodyKeysFromResolved(resolved);
  const paramNames = parseTemplateBodyParameterNamesFromResolved(keys.length, resolved);
  const parameters = keys.map((k, i) => {
    const p = {
      type: "text",
      text: nonEmptyTemplateParamText(getLeadField(args.ctx, k))
    };
    if (paramNames?.[i]) {
      p.parameter_name = paramNames[i];
    }
    return p;
  });
  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const template = {
    name: templateName,
    language: { code: templateLanguage }
  };
  const envComponents = buildWhatsappTemplateComponentsFromEnv(args.ctx, resolved);
  if (envComponents && envComponents.length > 0) {
    template.components = envComponents;
  } else if (parameters.length > 0) {
    template.components = [{ type: "body", parameters }];
  }
  const body = {
    messaging_product: "whatsapp",
    to: toDigits,
    type: "template",
    template
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    const isTemplateParamMismatch = /(#132000|localizable_params|expected number of params)/i.test(text);
    const safeError = isTemplateParamMismatch ? "WhatsApp template param mismatch (jumlah variabel tidak sesuai template)." : `WhatsApp API error (${res.status}).`;
    const usesNamed = Boolean(paramNames && paramNames.length === parameters.length);
    console.error("contact-submit: WhatsApp Graph request failed", {
      status: res.status,
      template: templateName,
      language: templateLanguage,
      body_key_count: keys.length,
      body_uses_parameter_name: usesNamed,
      components_override: Boolean(envComponents),
      graph_error_preview: text.slice(0, 400)
    });
    return { ok: false, error: safeError };
  }
  const responseSnippet = text.slice(0, 8e3);
  try {
    const parsed = JSON.parse(text);
    let messageId = extractWaMessageIdFromGraphResponse(parsed);
    if (!messageId) messageId = extractWaMessageIdFromRawText(text);
    return { ok: true, message_id: messageId, response_text: responseSnippet };
  } catch {
    const messageId = extractWaMessageIdFromRawText(text);
    return { ok: true, message_id: messageId, response_text: responseSnippet };
  }
}
function waTicketIdFromConversationUuid(convId) {
  return "WA-" + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();
}
async function syncLeadTicketAfterOutboundConversation(admin, organizationId, leadId, whatsappDb, customerWaDigits) {
  if (whatsappDb === null || "error" in whatsappDb) return { ok: false, error: "skip" };
  const convId = whatsappDb.conversation_id;
  if (!convId) return { ok: false, error: "no conversation_id" };
  const waTicket = waTicketIdFromConversationUuid(convId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const { error: delErr } = await admin.from("leads").delete().eq("organization_id", organizationId).eq("ticket_id", waTicket).neq("id", leadId);
  if (delErr) {
    console.error("syncLeadTicketAfterOutboundConversation: delete duplicate leads failed", delErr);
    return { ok: false, error: delErr.message };
  }
  const patch = { ticket_id: waTicket, updated_at: now };
  const digits = String(customerWaDigits ?? "").replace(/\D/g, "").trim();
  if (digits.length >= 9) patch.phone_number = digits;
  const { error: upErr } = await admin.from("leads").update(patch).eq("id", leadId).eq("organization_id", organizationId);
  if (upErr) {
    console.error("syncLeadTicketAfterOutboundConversation: update lead failed", upErr);
    return { ok: false, error: upErr.message };
  }
  return { ok: true, ticket_id: waTicket };
}
function customerWaIdFromE164(e164) {
  return e164.replace(/^\+/, "").replace(/[^\d]/g, "");
}
async function fetchDefaultWhatsappConversationLeadStatusId(admin, organizationId) {
  const orgOrGlobal = `organization_id.eq.${organizationId},organization_id.is.null`;
  const { data: openStatus } = await admin.from("lead_statuses").select("id").or(orgOrGlobal).eq("name", "Open").maybeSingle();
  if (openStatus?.id) return openStatus.id;
  const { data: unreadStatus } = await admin.from("lead_statuses").select("id").or(orgOrGlobal).eq("name", "Unread").maybeSingle();
  return unreadStatus?.id ?? null;
}
async function findWhatsappConversationIdLax(admin, organizationId, phoneNumberId, customerDigits) {
  const { data: rows, error } = await admin.from("whatsapp_conversations").select("id, customer_wa_id, lead_status_id, created_at").eq("organization_id", organizationId).eq("channel", "whatsapp").eq("phone_number_id", phoneNumberId).order("created_at", { ascending: true }).limit(100);
  if (error || !rows?.length) return null;
  const matches = rows.filter(
    (r) => customerWaIdFromE164(String(r.customer_wa_id ?? "")) === customerDigits
  );
  if (!matches.length) return null;
  matches.sort(
    (a, b) => {
      const aNull = a.lead_status_id == null ? 1 : 0;
      const bNull = b.lead_status_id == null ? 1 : 0;
      if (aNull !== bNull) return aNull - bNull;
      return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
    }
  );
  return matches[0]?.id ?? null;
}
async function upsertConversationAndInsertOutboundMessage(args) {
  const customerWaId = customerWaIdFromE164(args.customerE164);
  if (!customerWaId) {
    return { error: "Invalid customer phone for WhatsApp logging" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const { data: existingRows, error: selErr } = await args.admin.from("whatsapp_conversations").select("id").eq("organization_id", args.organizationId).eq("customer_wa_id", customerWaId).eq("phone_number_id", args.phoneNumberId).eq("channel", "whatsapp").limit(1);
  if (selErr) return { error: selErr.message };
  let conversationId = existingRows?.[0]?.id;
  if (!conversationId) {
    conversationId = await findWhatsappConversationIdLax(
      args.admin,
      args.organizationId,
      args.phoneNumberId,
      customerWaId
    ) ?? void 0;
  }
  if (conversationId) {
    const { error: upErr } = await args.admin.from("whatsapp_conversations").update({
      customer_name: args.customerName,
      customer_wa_id: customerWaId,
      customer_external_id: customerWaId,
      last_message_at: now,
      last_message_body: args.lastMessageBody,
      updated_at: now
    }).eq("id", conversationId);
    if (upErr) return { error: upErr.message };
  } else {
    const defaultLeadStatusId = await fetchDefaultWhatsappConversationLeadStatusId(
      args.admin,
      args.organizationId
    );
    const insertRow = {
      organization_id: args.organizationId,
      customer_wa_id: customerWaId,
      customer_external_id: customerWaId,
      channel: "whatsapp",
      phone_number_id: args.phoneNumberId,
      customer_name: args.customerName,
      last_message_at: now,
      last_message_body: args.lastMessageBody,
      updated_at: now
    };
    if (defaultLeadStatusId) insertRow.lead_status_id = defaultLeadStatusId;
    const { data: inserted, error: insErr } = await args.admin.from("whatsapp_conversations").insert(insertRow).select("id").single();
    if (insErr) {
      const dup = insErr.code === "23505" || /duplicate key|unique constraint/i.test(insErr.message);
      if (dup) {
        const racedId = await findWhatsappConversationIdLax(
          args.admin,
          args.organizationId,
          args.phoneNumberId,
          customerWaId
        ) ?? void 0;
        if (racedId) {
          conversationId = racedId;
        } else {
          const { data: racedRows, error: racedErr } = await args.admin.from("whatsapp_conversations").select("id").eq("organization_id", args.organizationId).eq("customer_wa_id", customerWaId).eq("phone_number_id", args.phoneNumberId).eq("channel", "whatsapp").limit(1);
          if (racedErr) return { error: racedErr.message };
          conversationId = racedRows?.[0]?.id;
        }
      } else {
        return { error: insErr.message };
      }
    } else {
      conversationId = inserted?.id;
    }
  }
  if (!conversationId) return { error: "Conversation ensure returned no id" };
  const meta = { ...args.rawMetadata, idempotency_key: args.idempotencyKey };
  const waMid = args.waMessageId.trim();
  const bodyText = args.messageBody.trim() || args.lastMessageBody;
  if (waMid) {
    const { data: existingMsg, error: existingErr } = await args.admin.from("whatsapp_messages").select("id").eq("wa_message_id", waMid).maybeSingle();
    if (existingErr) return { error: existingErr.message };
    if (existingMsg?.id) {
      return { conversation_id: conversationId, message_id: existingMsg.id };
    }
  } else {
    const { data: existingByKey, error: keyErr } = await args.admin.from("whatsapp_messages").select("id").eq("conversation_id", conversationId).contains("raw_metadata", { idempotency_key: args.idempotencyKey }).limit(1).maybeSingle();
    if (keyErr) return { error: keyErr.message };
    if (existingByKey?.id) {
      return { conversation_id: conversationId, message_id: existingByKey.id };
    }
  }
  const { data: msg, error: msgErr } = await args.admin.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    direction: "outbound",
    wa_message_id: waMid || null,
    platform_message_id: waMid || null,
    message_type: "template",
    body: bodyText,
    raw_metadata: meta,
    status: "accepted",
    status_updated_at: now,
    channel: "whatsapp"
  }).select("id").single();
  if (msgErr) {
    const dup = msgErr.code === "23505" || /duplicate key|unique constraint/i.test(msgErr.message);
    if (dup && waMid) {
      const { data: raced, error: racedErr } = await args.admin.from("whatsapp_messages").select("id").eq("wa_message_id", waMid).maybeSingle();
      if (!racedErr && raced?.id) {
        return { conversation_id: conversationId, message_id: raced.id };
      }
    }
    if (dup && !waMid) {
      const { data: racedKey, error: racedKeyErr } = await args.admin.from("whatsapp_messages").select("id").eq("conversation_id", conversationId).contains("raw_metadata", { idempotency_key: args.idempotencyKey }).limit(1).maybeSingle();
      if (!racedKeyErr && racedKey?.id) {
        return { conversation_id: conversationId, message_id: racedKey.id };
      }
    }
    return { error: msgErr.message };
  }
  const messageId = msg?.id;
  if (!messageId) return { error: "Message insert returned no id" };
  return { conversation_id: conversationId, message_id: messageId };
}

// supabase/functions/_shared/postSubmitWhatsApp.ts
function isIsoDateOnly2(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}
function buildWeddingWhatsAppCtx(args) {
  const pkg = args.package_label.trim();
  const evDate = typeof args.mergedFormData.event_date === "string" && isIsoDateOnly2(args.mergedFormData.event_date) ? args.mergedFormData.event_date.trim() : "";
  const evTime = String(args.mergedFormData.event_time ?? "").trim();
  const evAddr = String(args.mergedFormData.event_address ?? "").trim();
  const jobLine = [evDate && `Tanggal ${evDate}`, evTime && `Jam ${evTime}`].filter(Boolean).join(" \xB7 ");
  return {
    name: args.name,
    email: args.email,
    phone_number: args.phone_number,
    industry: pkg || "Wedding",
    business_type: "B2C",
    job_title: jobLine || "Calon pengantin",
    needs: pkg || "Konsultasi paket wedding",
    office_address: evAddr || "\u2014",
    lead_id: args.leadId,
    lead_vialdiid_id: args.submissionId,
    package_label: pkg,
    event_date: evDate,
    event_time: evTime,
    event_address: evAddr,
    submission_id: args.submissionId,
    leads_vialdi_wedding_id: args.submissionId,
    ringkasan_kebutuhan: String(args.mergedFormData.ringkasan_kebutuhan ?? "").trim()
  };
}
function waResponseFromSend(wa) {
  if (!wa.ok) {
    return { sent: false, error: wa.error, skipped: wa.skipped, skip_reason: wa.skip_reason };
  }
  if (wa.skipped) {
    return { sent: false, skipped: true, skip_reason: wa.skip_reason, message_id: null };
  }
  return { sent: true, message_id: wa.message_id ?? null };
}
async function runPostSubmitWhatsAppForSubmission(args) {
  if (args.webId !== "vialdi-wedding" || args.formId !== "contact-main") {
    return null;
  }
  const pkg = (args.package_label ?? "").trim();
  const to = normalizePhoneE164(args.phone_number);
  if (!to) {
    return { sent: false, error: "Invalid phone for WhatsApp (empty after normalization)" };
  }
  const ctx = buildWeddingWhatsAppCtx({
    submissionId: args.submissionId,
    leadId: args.leadId,
    name: args.name,
    email: args.email,
    phone_number: args.phone_number,
    package_label: pkg,
    mergedFormData: args.mergedFormData
  });
  const graphPhoneNumberId = await resolveWhatsappPhoneNumberIdFromOrgTable(
    args.admin,
    args.organizationId,
    args.webId
  );
  const wa = await sendWhatsappTemplateToClient({
    toE164: to,
    ctx,
    graphPhoneNumberId,
    webId: args.webId,
    admin: args.admin,
    organizationId: args.organizationId
  });
  if (wa.ok && wa.skipped && wa.skip_reason) {
    console.warn(`contact-submit: lead ${args.leadId} saved; WhatsApp skipped: ${wa.skip_reason}`);
  }
  if (!wa.ok) {
    console.error(`contact-submit: WhatsApp API error for lead ${args.leadId}:`, wa.error);
  }
  const waTemplateResolved = await resolveWhatsappTemplateEnvWithDb(
    args.admin,
    args.organizationId,
    args.webId
  );
  const templateName = waTemplateResolved.templateName;
  const templateLanguage = waTemplateResolved.templateLanguage;
  const phoneNumberId = (graphPhoneNumberId?.trim() || Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "").trim();
  if (wa.ok && !wa.skipped && phoneNumberId) {
    const keys = parseTemplateBodyKeysFromResolved(waTemplateResolved);
    const messagePreview = formatTemplateMessageBody({ templateName, keys, ctx });
    const lastMessageBody = messagePreview.slice(0, 1024);
    const responseText = wa.ok && "response_text" in wa ? wa.response_text ?? "" : "";
    const effectiveWamid = (typeof wa.message_id === "string" && wa.message_id.trim() || extractWaMessageIdFromRawText(responseText) || "").trim();
    const rawMetadata = {
      source: "contact-submit",
      template: { name: templateName, language: templateLanguage },
      template_body_keys: keys,
      lead_id: args.leadId,
      submission_id: args.submissionId,
      customer_e164: to,
      graph_wamid: effectiveWamid || null,
      parameters: Object.fromEntries(keys.map((k) => [k, ctx[k] ?? ""])),
      graph_response_snippet: responseText.slice(0, 2e3)
    };
    const whatsapp_db = await upsertConversationAndInsertOutboundMessage({
      admin: args.admin,
      organizationId: args.organizationId,
      customerE164: to,
      customerName: args.name,
      phoneNumberId,
      waMessageId: effectiveWamid,
      messageBody: messagePreview,
      idempotencyKey: `contact-submit:step2:${args.submissionId}`,
      lastMessageBody,
      rawMetadata
    });
    if ("error" in whatsapp_db) {
      console.warn("contact-submit: whatsapp_messages upsert failed", whatsapp_db.error);
    } else {
      await syncLeadTicketAfterOutboundConversation(
        args.admin,
        args.organizationId,
        args.leadId,
        whatsapp_db,
        to.replace(/^\+/, "").replace(/[^\d]/g, "")
      );
    }
  }
  return waResponseFromSend(wa);
}

// supabase/functions/_shared/extractDenormalized.ts
function applyCrmMapping(mergedFormData, crmMapping) {
  const out = {
    name: null,
    phone_number: null,
    email: null,
    package_label: null
  };
  const map = crmMapping;
  for (const [formKey, col] of Object.entries(map)) {
    const v = mergedFormData[formKey];
    if (v === void 0 || v === null) continue;
    const s = typeof v === "string" ? v.trim() : String(v);
    if (!s) continue;
    if (col === "name") out.name = s;
    else if (col === "phone_number") out.phone_number = s;
    else if (col === "email") out.email = s;
    else if (col === "package_label") out.package_label = s;
  }
  return out;
}

// supabase/functions/_shared/rateLimitByWebId.ts
var BUCKET_SECONDS = 60;
var MAX_TOKENS = 30;
async function sha256Hex2(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function bucketWindowIso(now = /* @__PURE__ */ new Date()) {
  const ms = Math.floor(now.getTime() / (BUCKET_SECONDS * 1e3)) * BUCKET_SECONDS * 1e3;
  return new Date(ms).toISOString();
}
async function rateLimitByWebId(admin, webId, clientIp) {
  const ipHash = await sha256Hex2(clientIp || "unknown");
  const window = bucketWindowIso();
  const { data: row } = await admin.from("hub_rate_limits").select("tokens").eq("web_id", webId).eq("client_ip_hash", ipHash).eq("bucket_window", window).maybeSingle();
  const tokens = (row?.tokens ?? 0) + 1;
  if (tokens > MAX_TOKENS) {
    return { ok: false, retryAfterSeconds: BUCKET_SECONDS };
  }
  await admin.from("hub_rate_limits").upsert(
    {
      web_id: webId,
      client_ip_hash: ipHash,
      bucket_window: window,
      tokens
    },
    { onConflict: "web_id,client_ip_hash,bucket_window" }
  );
  return { ok: true };
}
function clientIpFromRequest(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

// supabase/functions/_shared/resolveWebId.ts
var CACHE_TTL_MS = 6e4;
var cache = /* @__PURE__ */ new Map();
function cacheKey(raw) {
  return raw.trim().toLowerCase();
}
async function resolveActiveProperty(admin, rawWebId) {
  if (typeof rawWebId !== "string") {
    return { ok: false, status: 404, error: "unknown_web_id" };
  }
  const trimmed = rawWebId.trim();
  if (trimmed.length < 3 || trimmed.length > 64) {
    return { ok: false, status: 404, error: "unknown_web_id" };
  }
  const key = cacheKey(trimmed);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    if (!hit.value) return { ok: false, status: 404, error: "unknown_web_id" };
    if (!hit.value.is_active) return { ok: false, status: 403, error: "property_inactive" };
    return { ok: true, property: hit.value };
  }
  const { data: aliasRow } = await admin.from("property_web_id_aliases").select("canonical_slug").eq("alias", trimmed.toLowerCase()).maybeSingle();
  const slug = (aliasRow?.canonical_slug ?? trimmed).toLowerCase();
  const { data: prop, error } = await admin.from("properties").select("slug, organization_id, is_active, display_name").eq("slug", slug).maybeSingle();
  if (error || !prop) {
    cache.set(key, { at: now, value: null });
    return { ok: false, status: 404, error: "unknown_web_id" };
  }
  const resolved = {
    slug: String(prop.slug),
    organization_id: String(prop.organization_id),
    is_active: Boolean(prop.is_active),
    display_name: String(prop.display_name ?? prop.slug)
  };
  cache.set(key, { at: now, value: resolved });
  if (!resolved.is_active) {
    return { ok: false, status: 403, error: "property_inactive" };
  }
  return { ok: true, property: resolved };
}

// supabase/functions/_shared/supabaseAdmin.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
function mustGetEnv(name) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
function createServiceClient() {
  const url = mustGetEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// supabase/functions/_shared/validateFormStep.ts
var MAX_FORM_DATA_BYTES = 64 * 1024;
function byteLengthJson(obj) {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}
function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isPhone(s) {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 16;
}
function parseFormSchema(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = raw;
  if (o.version !== 1 || !Array.isArray(o.steps)) return null;
  return o;
}
function getStepFields(schema, step) {
  const found = schema.steps.find((s) => s.step === step);
  return found?.fields ?? null;
}
function getMaxStep(schema) {
  return Math.max(...schema.steps.map((s) => s.step), 1);
}
function validateFormStep(fields, formData) {
  const sanitized = {};
  const allowedKeys = new Set(fields.map((f) => f.key));
  for (const key of Object.keys(formData)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }
  for (const field of fields) {
    if (field.type === "honeypot") {
      const v = formData[field.key];
      if (v !== void 0 && v !== null && String(v).trim() !== "") {
        return { ok: true, sanitized: {}, honeypotTriggered: true };
      }
      continue;
    }
    const raw = formData[field.key];
    const empty = raw === void 0 || raw === null || String(raw).trim() === "";
    if (empty) {
      if (field.required) return { ok: false, error: `Missing required field: ${field.key}` };
      continue;
    }
    let val = raw;
    switch (field.type) {
      case "text":
      case "textarea":
      case "phone":
      case "email":
      case "date": {
        if (typeof val !== "string") return { ok: false, error: `Invalid type for ${field.key}` };
        const s = val.trim();
        const max = field.maxLength ?? (field.type === "textarea" ? 4e3 : 200);
        if (s.length > max) return { ok: false, error: `${field.key} too long` };
        if (field.type === "email" && !isEmail(s)) return { ok: false, error: `Invalid email` };
        if (field.type === "phone" && !isPhone(s)) return { ok: false, error: `Invalid phone` };
        val = s;
        break;
      }
      case "select": {
        if (typeof val !== "string") return { ok: false, error: `Invalid select for ${field.key}` };
        const s = val.trim();
        if (field.options && !field.options.includes(s)) {
          return { ok: false, error: `Invalid option for ${field.key}` };
        }
        val = s;
        break;
      }
      case "consent": {
        if (val !== true && val !== "true" && val !== 1) {
          return { ok: false, error: `Consent required: ${field.key}` };
        }
        val = true;
        break;
      }
      default:
        if (typeof val === "string") val = val.trim();
    }
    sanitized[field.key] = val;
  }
  if (byteLengthJson(sanitized) > MAX_FORM_DATA_BYTES) {
    return { ok: false, error: "form_data too large" };
  }
  return { ok: true, sanitized, honeypotTriggered: false };
}

// supabase/functions-src/contact-submit/index.ts
function mergeFormData(existing, stepPatch) {
  return { ...existing, ...stepPatch };
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
  const admin = createServiceClient();
  const resolved = await resolveActiveProperty(admin, body.web_id);
  if (!resolved.ok) {
    return jsonResponse({ error: resolved.error }, { status: resolved.status }, origin);
  }
  const property = resolved.property;
  const rl = await rateLimitByWebId(admin, property.slug, clientIpFromRequest(req));
  if (!rl.ok) {
    return jsonResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      origin
    );
  }
  const formId = typeof body.form_id === "string" ? body.form_id.trim() : "";
  if (!formId) {
    return jsonResponse({ error: "form_id required" }, { status: 400 }, origin);
  }
  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 1) {
    return jsonResponse({ error: "Invalid step" }, { status: 400 }, origin);
  }
  const { data: formDef, error: formErr } = await admin.from("form_definitions").select("id, version, schema, crm_mapping, is_active").eq("web_id", property.slug).eq("form_id", formId).eq("is_active", true).maybeSingle();
  if (formErr || !formDef) {
    return jsonResponse({ error: "Form not found" }, { status: 400 }, origin);
  }
  const schema = parseFormSchema(formDef.schema);
  if (!schema) {
    return jsonResponse({ error: "Invalid form schema" }, { status: 500 }, origin);
  }
  const fields = getStepFields(schema, step);
  if (!fields) {
    return jsonResponse({ error: "Invalid step for form" }, { status: 400 }, origin);
  }
  const formDataIn = body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data) ? body.form_data : {};
  const validated = validateFormStep(fields, formDataIn);
  if (!validated.ok) {
    return jsonResponse({ error: validated.error }, { status: 400 }, origin);
  }
  if (validated.honeypotTriggered) {
    return jsonResponse({ ok: true, submission_id: null, lead_id: null }, { status: 200 }, origin);
  }
  const maxStep = getMaxStep(schema);
  const isFinalStep = step >= maxStep;
  if (isFinalStep) {
    if (typeof body.analytics_session_id !== "string" || !body.analytics_session_id.trim()) {
      return jsonResponse(
        { error: "analytics_session_id required on final step" },
        { status: 400 },
        origin
      );
    }
    if (body.attribution === void 0 || body.attribution === null) {
      return jsonResponse({ error: "attribution required on final step" }, { status: 400 }, origin);
    }
    const parsedAttr = parseLeadAttribution(body.attribution);
    if (!parsedAttr) {
      return jsonResponse({ error: "Invalid attribution" }, { status: 400 }, origin);
    }
  }
  let systemUserId;
  try {
    systemUserId = mustGetEnv("SYSTEM_USER_ID");
  } catch (e) {
    return jsonResponse({ error: e.message }, { status: 500 }, origin);
  }
  const crmMapping = formDef.crm_mapping ?? {};
  const submissionId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : void 0;
  let existingRow = null;
  if (submissionId) {
    const { data: row, error: loadErr } = await admin.from("lead_submissions").select("*").eq("id", submissionId).maybeSingle();
    if (loadErr || !row) {
      return jsonResponse({ error: "Submission not found" }, { status: 400 }, origin);
    }
    if (String(row.web_id) !== property.slug || String(row.form_id) !== formId) {
      return jsonResponse({ error: "Submission not valid" }, { status: 400 }, origin);
    }
    existingRow = row;
  }
  const merged = mergeFormData(
    existingRow?.form_data ?? {},
    validated.sanitized
  );
  const denorm = applyCrmMapping(merged, crmMapping);
  const packageLabel = typeof body.package_label === "string" && body.package_label.trim() || denorm.package_label || null;
  const parsedAttrFinal = isFinalStep ? parseLeadAttribution(body.attribution) : null;
  let leadId = typeof existingRow?.lead_id === "string" ? String(existingRow.lead_id) : null;
  let identityHash = typeof existingRow?.identity_hash === "string" ? String(existingRow.identity_hash) : null;
  const name = denorm.name ?? "";
  const phone = denorm.phone_number ?? "";
  const email = denorm.email ?? "";
  let draftLeadIdFromSession = leadId;
  if (step === 1 && !draftLeadIdFromSession && typeof body.analytics_session_id === "string" && body.analytics_session_id.trim()) {
    const { data: draftRow } = await admin.from("lead_submissions").select("lead_id").eq("web_id", property.slug).eq("organization_id", property.organization_id).eq("analytics_session_id", body.analytics_session_id.trim()).eq("form_id", formId).eq("status", "draft").maybeSingle();
    if (draftRow?.lead_id) {
      draftLeadIdFromSession = String(draftRow.lead_id);
    }
  }
  if (step === 1 && name && phone && email) {
    const crmAttribution = parsedAttrFinal ? attributionToJsonb(parsedAttrFinal.attribution) : null;
    const crmLabel = parsedAttrFinal?.label ?? null;
    const sessionId = typeof body.analytics_session_id === "string" ? body.analytics_session_id.trim() : null;
    if (draftLeadIdFromSession) {
      const patched = await patchCrmLeadFromStep1({
        admin,
        leadId: draftLeadIdFromSession,
        systemUserId,
        organizationId: property.organization_id,
        webId: property.slug,
        formId,
        name,
        phone_number: phone,
        email,
        package_label: packageLabel,
        analytics_session_id: sessionId,
        attribution: crmAttribution,
        attribution_label: crmLabel
      });
      if (!patched.ok) {
        return jsonResponse({ error: patched.error }, { status: 500 }, origin);
      }
      leadId = draftLeadIdFromSession;
      identityHash = patched.identityHash;
    } else {
      const crm = await syncCrmLeadStep1({
        admin,
        systemUserId,
        organizationId: property.organization_id,
        webId: property.slug,
        formId,
        name,
        phone_number: phone,
        email,
        package_label: packageLabel,
        analytics_session_id: sessionId,
        attribution: crmAttribution,
        attribution_label: crmLabel,
        propertyDisplayName: property.display_name
      });
      if (!crm.ok) {
        return jsonResponse({ error: crm.error }, { status: 500 }, origin);
      }
      leadId = crm.leadId;
      identityHash = crm.identityHash;
    }
  }
  const rowPatch = {
    web_id: property.slug,
    form_id: formId,
    form_version: formDef.version,
    step,
    form_data: merged,
    name: denorm.name,
    phone_number: denorm.phone_number,
    email: denorm.email,
    package_label: packageLabel,
    organization_id: property.organization_id,
    lead_id: leadId,
    identity_hash: identityHash,
    status: isFinalStep ? "submitted" : "draft",
    submitted_at: isFinalStep ? (/* @__PURE__ */ new Date()).toISOString() : null
  };
  if (isFinalStep) {
    rowPatch.analytics_session_id = body.analytics_session_id.trim();
    if (parsedAttrFinal) {
      rowPatch.attribution = attributionToJsonb(parsedAttrFinal.attribution);
      rowPatch.attribution_label = parsedAttrFinal.label;
    }
  } else if (body.analytics_session_id) {
    rowPatch.analytics_session_id = body.analytics_session_id.trim();
  }
  let savedId;
  function isFinalDedupeError(err) {
    if (!err) return false;
    if (err.code === "23505") return true;
    return /uq_lead_submissions_final_dedupe|duplicate key/i.test(err.message ?? "");
  }
  if (submissionId) {
    const { data: updated, error: upErr } = await admin.from("lead_submissions").update(rowPatch).eq("id", submissionId).select("id, lead_id").single();
    if (upErr || !updated) {
      if (isFinalStep && isFinalDedupeError(upErr)) {
        return jsonResponse(
          { error: "Lead sudah pernah dikirim untuk session ini" },
          { status: 400 },
          origin
        );
      }
      return jsonResponse({ error: upErr?.message ?? "Update failed" }, { status: 500 }, origin);
    }
    savedId = String(updated.id);
    leadId = updated.lead_id ? String(updated.lead_id) : leadId;
  } else if (step === 1 && rowPatch.analytics_session_id && rowPatch.status === "draft") {
    const sessionId = String(rowPatch.analytics_session_id);
    const { data: existingDraft } = await admin.from("lead_submissions").select("id, lead_id").eq("web_id", property.slug).eq("organization_id", property.organization_id).eq("analytics_session_id", sessionId).eq("form_id", formId).eq("status", "draft").eq("step", 1).maybeSingle();
    if (existingDraft?.id) {
      const { data: updated, error: upErr } = await admin.from("lead_submissions").update(rowPatch).eq("id", existingDraft.id).select("id, lead_id").single();
      if (upErr || !updated) {
        return jsonResponse({ error: upErr?.message ?? "Update failed" }, { status: 500 }, origin);
      }
      savedId = String(updated.id);
      leadId = updated.lead_id ? String(updated.lead_id) : leadId;
    } else {
      const { data: inserted, error: insErr } = await admin.from("lead_submissions").insert(rowPatch).select("id, lead_id").single();
      if (insErr || !inserted) {
        if (insErr?.code === "23505") {
          const { data: raced } = await admin.from("lead_submissions").select("id, lead_id").eq("web_id", property.slug).eq("organization_id", property.organization_id).eq("analytics_session_id", sessionId).eq("form_id", formId).eq("status", "draft").eq("step", 1).maybeSingle();
          if (raced?.id) {
            const { data: updated, error: raceUpErr } = await admin.from("lead_submissions").update(rowPatch).eq("id", raced.id).select("id, lead_id").single();
            if (!raceUpErr && updated) {
              savedId = String(updated.id);
              leadId = updated.lead_id ? String(updated.lead_id) : leadId;
            } else {
              return jsonResponse(
                { error: raceUpErr?.message ?? insErr.message },
                { status: 500 },
                origin
              );
            }
          } else {
            return jsonResponse({ error: insErr.message }, { status: 500 }, origin);
          }
        } else {
          return jsonResponse({ error: insErr?.message ?? "Insert failed" }, { status: 500 }, origin);
        }
      } else {
        savedId = String(inserted.id);
        leadId = inserted.lead_id ? String(inserted.lead_id) : leadId;
      }
    }
  } else {
    const { data: inserted, error: insErr } = await admin.from("lead_submissions").insert(rowPatch).select("id, lead_id").single();
    if (insErr || !inserted) {
      return jsonResponse({ error: insErr?.message ?? "Insert failed" }, { status: 500 }, origin);
    }
    savedId = String(inserted.id);
    leadId = inserted.lead_id ? String(inserted.lead_id) : leadId;
  }
  if (isFinalStep && leadId) {
    await updateCrmLeadFromSubmission({
      admin,
      leadId,
      organizationId: property.organization_id,
      webId: property.slug,
      formId,
      mergedFormData: merged,
      package_label: packageLabel,
      attribution: parsedAttrFinal ? attributionToJsonb(parsedAttrFinal.attribution) : null,
      attribution_label: parsedAttrFinal?.label ?? null,
      analytics_session_id: body.analytics_session_id?.trim() ?? null
    });
  }
  let whatsapp;
  if (isFinalStep && leadId && name && phone && email) {
    const wa = await runPostSubmitWhatsAppForSubmission({
      admin,
      organizationId: property.organization_id,
      webId: property.slug,
      formId,
      submissionId: savedId,
      leadId,
      name,
      email,
      phone_number: phone,
      package_label: packageLabel,
      mergedFormData: merged
    });
    if (wa) whatsapp = wa;
  }
  return jsonResponse(
    { submission_id: savedId, lead_id: leadId, id: savedId, ...whatsapp ? { whatsapp } : {} },
    { status: 200 },
    origin
  );
});
