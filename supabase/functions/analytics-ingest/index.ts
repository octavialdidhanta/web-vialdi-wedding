/**
 * Supabase Edge Function: analytics-ingest
 * Batched first-party analytics from the SPA. Service role + RPC for session touch.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MAX_EVENTS = 50;
const MAX_PATH_LEN = 512;
const MAX_LABEL_LEN = 200;
const MAX_URL_LEN = 2000;
const MAX_TRACK_KEY_LEN = 80;
const MAX_LANDING_URL_LEN = 1000;
const MAX_UTM_LEN = 200;

type SessionTouch = {
  type: "session_touch";
  referrer?: string;
  ua_hash?: string;
  auth_user_id?: string | null;
  landing_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  meta_campaign_name?: string;
  meta_adset_name?: string;
  meta_ad_name?: string;
  has_gclid?: boolean;
  has_fbclid?: boolean;
  has_msclkid?: boolean;
  has_gbraid?: boolean;
  has_wbraid?: boolean;
};

type PageView = { type: "page_view"; path: string };
type ActivePing = { type: "active_ping"; path: string; delta_ms: number; scroll_max_pct?: number };
type PageEnd = { type: "page_end"; path: string; scroll_max_pct?: number };
type Click = {
  type: "click";
  path: string;
  track_key?: string | null;
  element_type: string;
  element_label: string;
  target_url?: string | null;
  is_internal?: boolean;
};

type IngestEvent = SessionTouch | PageView | ActivePing | PageEnd | Click;

type Body = {
  session_id: string;
  /** Harus salah satu: vialdi | vialdi-wedding | synckerja (sama dengan CHECK di DB). */
  web_id: string;
  auth_user_id?: string | null;
  events: IngestEvent[];
};

const ALLOWED_WEB_IDS = ["vialdi", "vialdi-wedding", "synckerja"] as const;

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

  // Browsers reject ACAO "*" together with Access-Control-Allow-Credentials: true.
  // Our client uses the anon Authorization header on a cross-origin request to Supabase.
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

  // ALLOWED_ORIGINS is set but this Origin is not listed (typo, http vs https, www vs apex).
  // Omit ACAO so the browser blocks; fix secrets to include exact origins, e.g.
  // https://vialdi.id,https://www.vialdi.id,http://localhost:8080
  return {};
}

/** Preflight must repeat Allow-Headers / Allow-Methods; OPTIONS was only sending ACAO before. */
function corsPreflightHeaders(origin: string | null): HeadersInit {
  const h: Record<string, string> = {
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
  };
  const extra = corsHeaders(origin) as Record<string, string>;
  for (const [k, v] of Object.entries(extra)) {
    if (v != null && v !== "") {
      h[k] = v;
    }
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

const rateState = new Map<string, { minute: number; count: number }>();

function rateOk(ip: string): boolean {
  const minute = Math.floor(Date.now() / 60_000);
  const cur = rateState.get(ip);
  if (!cur || cur.minute !== minute) {
    rateState.set(ip, { minute, count: 1 });
    return true;
  }
  cur.count += 1;
  return cur.count <= 400;
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
  if (s.length === 0) return "";
  return s.length <= max ? s : s.slice(0, max);
}

/** Meta `{{site_source_name}}` dan placement umum (bukan daftar lengkap). */
function looksMetaUtmSource(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s) return false;
  const exact = new Set([
    "fb",
    "ig",
    "msg",
    "an",
    "facebook",
    "instagram",
    "messenger",
    "fbinstagram",
    "audience_network",
    "audnetwork",
  ]);
  if (exact.has(s)) return true;
  if (s.includes("facebook") || s.includes("instagram")) return true;
  return false;
}

async function closeOpenPageViews(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  webId: string,
) {
  await supabase
    .from("analytics_page_views")
    .update({ ended_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("web_id", webId)
    .is("ended_at", null);
}

async function applyActivePing(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  path: string,
  delta: number,
  scrollMaxPct: number | null,
  webId: string,
) {
  if (delta <= 0 || delta > 120_000) return;
  const { data: row } = await supabase
    .from("analytics_page_views")
    .select("id, active_ms, path, scroll_max_pct")
    .eq("session_id", sessionId)
    .eq("web_id", webId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.id || row.path !== path) return;
  const incoming = typeof scrollMaxPct === "number" && Number.isFinite(scrollMaxPct) ? scrollMaxPct : null;
  const clipped = incoming == null ? null : Math.max(0, Math.min(100, Math.floor(incoming)));
  const prev = typeof row.scroll_max_pct === "number" ? row.scroll_max_pct : 0;
  const nextScroll = clipped == null ? prev : Math.max(prev, clipped);
  await supabase
    .from("analytics_page_views")
    .update({ active_ms: (row.active_ms ?? 0) + delta, scroll_max_pct: nextScroll })
    .eq("id", row.id);
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
    return badRequest("Invalid or missing web_id", origin);
  }

  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return badRequest("Invalid events", origin);
  }

  const url = mustGetEnv("SUPABASE_URL");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let mergedRef: string | null = null;
  let mergedUa: string | null = null;
  let mergedAuth: string | null = body.auth_user_id && isUuid(body.auth_user_id) ? body.auth_user_id : null;
  let mergedLanding = "";
  let mergedUtmSource = "";
  let mergedUtmMedium = "";
  let mergedUtmCampaign = "";
  let mergedUtmContent = "";
  let mergedUtmTerm = "";
  let mergedMetaCampaign = "";
  let mergedMetaAdset = "";
  let mergedMetaAd = "";
  let mergedHasGclid = false;
  let mergedHasFbclid = false;
  let mergedHasMsclkid = false;
  let mergedHasGbraid = false;
  let mergedHasWbraid = false;

  for (const ev of body.events) {
    if (ev?.type === "session_touch") {
      const st = ev as SessionTouch;
      if (st.referrer) mergedRef = st.referrer.slice(0, 500);
      if (st.ua_hash) mergedUa = st.ua_hash.slice(0, 64);
      if (st.auth_user_id && isUuid(st.auth_user_id)) mergedAuth = st.auth_user_id;
      const lu = clipText(st.landing_url, MAX_LANDING_URL_LEN);
      if (lu && !mergedLanding) mergedLanding = lu;
      const us = clipText(st.utm_source, MAX_UTM_LEN);
      if (us && !mergedUtmSource) mergedUtmSource = us;
      const um = clipText(st.utm_medium, MAX_UTM_LEN);
      if (um && !mergedUtmMedium) mergedUtmMedium = um;
      const uc = clipText(st.utm_campaign, MAX_UTM_LEN);
      if (uc && !mergedUtmCampaign) mergedUtmCampaign = uc;
      const uco = clipText(st.utm_content, MAX_UTM_LEN);
      if (uco && !mergedUtmContent) mergedUtmContent = uco;
      const ut = clipText(st.utm_term, MAX_UTM_LEN);
      if (ut && !mergedUtmTerm) mergedUtmTerm = ut;
      const mc = clipText(st.meta_campaign_name, MAX_UTM_LEN);
      if (mc && !mergedMetaCampaign) mergedMetaCampaign = mc;
      const mas = clipText(st.meta_adset_name, MAX_UTM_LEN);
      if (mas && !mergedMetaAdset) mergedMetaAdset = mas;
      const mad = clipText(st.meta_ad_name, MAX_UTM_LEN);
      if (mad && !mergedMetaAd) mergedMetaAd = mad;
      mergedHasGclid = mergedHasGclid || Boolean(st.has_gclid);
      mergedHasFbclid = mergedHasFbclid || Boolean(st.has_fbclid);
      mergedHasMsclkid = mergedHasMsclkid || Boolean(st.has_msclkid);
      mergedHasGbraid = mergedHasGbraid || Boolean(st.has_gbraid);
      mergedHasWbraid = mergedHasWbraid || Boolean(st.has_wbraid);
    }
  }

  /**
   * Meta Ads Manager "Campaign URL" sering hanya mengisi UTM:
   * utm_source=site, utm_medium=ad set name, utm_campaign=campaign name, utm_content=ad id.
   * Tanpa query meta_* terpisah, mirror ke kolom meta_* agar agregasi dashboard konsisten.
   */
  const hasExplicitMeta =
    mergedMetaCampaign.length > 0 || mergedMetaAdset.length > 0 || mergedMetaAd.length > 0;
  if (!hasExplicitMeta && (mergedHasFbclid || looksMetaUtmSource(mergedUtmSource))) {
    if (mergedUtmCampaign.length > 0) mergedMetaCampaign = mergedUtmCampaign;
    if (mergedUtmMedium.length > 0) mergedMetaAdset = mergedUtmMedium;
    if (mergedUtmContent.length > 0) mergedMetaAd = mergedUtmContent;
  }

  const { error: touchErr } = await supabase.rpc("analytics_session_touch", {
    p_session: body.session_id,
    p_web_id: webId,
    p_referrer: mergedRef ?? "",
    p_ua_hash: mergedUa ?? "",
    p_auth: mergedAuth,
    p_landing_url: mergedLanding,
    p_utm_source: mergedUtmSource,
    p_utm_medium: mergedUtmMedium,
    p_utm_campaign: mergedUtmCampaign,
    p_utm_content: mergedUtmContent,
    p_utm_term: mergedUtmTerm,
    p_meta_campaign_name: mergedMetaCampaign,
    p_meta_adset_name: mergedMetaAdset,
    p_meta_ad_name: mergedMetaAd,
    p_has_gclid: mergedHasGclid,
    p_has_fbclid: mergedHasFbclid,
    p_has_msclkid: mergedHasMsclkid,
    p_has_gbraid: mergedHasGbraid,
    p_has_wbraid: mergedHasWbraid,
  });
  if (touchErr) {
    console.error("analytics_session_touch", touchErr);
    return json({ error: "persist failed" }, { status: 500, headers: corsHeaders(origin) });
  }

  for (const ev of body.events) {
    if (!ev || typeof ev !== "object" || !("type" in ev)) {
      return badRequest("Invalid event", origin);
    }

    switch (ev.type) {
      case "session_touch":
        break;
      case "page_view": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        await closeOpenPageViews(supabase, body.session_id, webId);
        const { error } = await supabase.from("analytics_page_views").insert({
          session_id: body.session_id,
          web_id: webId,
          path: ev.path,
          started_at: new Date().toISOString(),
          active_ms: 0,
        });
        if (error) console.error("page_view", error);
        break;
      }
      case "active_ping": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        const d = Math.floor(Number(ev.delta_ms));
        const smp =
          typeof (ev as ActivePing).scroll_max_pct === "number"
            ? Number((ev as ActivePing).scroll_max_pct)
            : null;
        await applyActivePing(supabase, body.session_id, ev.path, d, smp, webId);
        break;
      }
      case "page_end": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        const incoming =
          typeof (ev as PageEnd).scroll_max_pct === "number"
            ? Number((ev as PageEnd).scroll_max_pct)
            : null;
        const clipped =
          incoming == null || !Number.isFinite(incoming)
            ? null
            : Math.max(0, Math.min(100, Math.floor(incoming)));
        const { data: row } = await supabase
          .from("analytics_page_views")
          .select("id, scroll_max_pct")
          .eq("session_id", body.session_id)
          .eq("web_id", webId)
          .eq("path", ev.path)
          .is("ended_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (row?.id) {
          const prev = typeof row.scroll_max_pct === "number" ? row.scroll_max_pct : 0;
          const nextScroll = clipped == null ? prev : Math.max(prev, clipped);
          await supabase
            .from("analytics_page_views")
            .update({ ended_at: new Date().toISOString(), scroll_max_pct: nextScroll })
            .eq("id", row.id);
        }
        break;
      }
      case "click": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        const label = (ev.element_label ?? "").toString().slice(0, MAX_LABEL_LEN);
        const et = (ev.element_type ?? "unknown").toString().slice(0, 40);
        const rawTk = ev.track_key ? String(ev.track_key).trim() : "";
        const tk =
          rawTk.length > 0
            ? rawTk.slice(0, MAX_TRACK_KEY_LEN)
            : (`${label || "unknown"}_${et === "a" ? "link" : "cta"}`)
                .toLowerCase()
                .replace(/[^a-z0-9_:\\-]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, MAX_TRACK_KEY_LEN);
        const tu = ev.target_url ? String(ev.target_url).slice(0, MAX_URL_LEN) : null;
        const { error } = await supabase.from("analytics_click_events").insert({
          session_id: body.session_id,
          web_id: webId,
          path: ev.path,
          track_key: tk,
          element_type: et,
          element_label: label,
          target_url: tu,
          is_internal: Boolean(ev.is_internal),
        });
        if (error) console.error("click", error);
        break;
      }
      default:
        return badRequest("Unknown event type", origin);
    }
  }

  return json({ ok: true }, { headers: corsHeaders(origin) });
});
