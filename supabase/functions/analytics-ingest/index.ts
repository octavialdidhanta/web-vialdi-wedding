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

type SessionTouch = {
  type: "session_touch";
  referrer?: string;
  ua_hash?: string;
  auth_user_id?: string | null;
};

type PageView = { type: "page_view"; path: string };
type ActivePing = { type: "active_ping"; path: string; delta_ms: number };
type PageEnd = { type: "page_end"; path: string };
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
  auth_user_id?: string | null;
  events: IngestEvent[];
};

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
  const allow = origin && list.length && list.includes(origin) ? origin : (list[0] ?? "*");
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-credentials": "true",
  };
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

async function closeOpenPageViews(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
) {
  await supabase
    .from("analytics_page_views")
    .update({ ended_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .is("ended_at", null);
}

async function applyActivePing(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  path: string,
  delta: number,
) {
  if (delta <= 0 || delta > 120_000) return;
  const { data: row } = await supabase
    .from("analytics_page_views")
    .select("id, active_ms, path")
    .eq("session_id", sessionId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.id || row.path !== path) return;
  await supabase
    .from("analytics_page_views")
    .update({ active_ms: (row.active_ms ?? 0) + delta })
    .eq("id", row.id);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
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

  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return badRequest("Invalid events", origin);
  }

  const url = mustGetEnv("SUPABASE_URL");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let mergedRef: string | null = null;
  let mergedUa: string | null = null;
  let mergedAuth: string | null = body.auth_user_id && isUuid(body.auth_user_id) ? body.auth_user_id : null;

  for (const ev of body.events) {
    if (ev?.type === "session_touch") {
      const st = ev as SessionTouch;
      if (st.referrer) mergedRef = st.referrer.slice(0, 500);
      if (st.ua_hash) mergedUa = st.ua_hash.slice(0, 64);
      if (st.auth_user_id && isUuid(st.auth_user_id)) mergedAuth = st.auth_user_id;
    }
  }

  const { error: touchErr } = await supabase.rpc("analytics_session_touch", {
    p_session: body.session_id,
    p_referrer: mergedRef ?? "",
    p_ua_hash: mergedUa ?? "",
    p_auth: mergedAuth,
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
        await closeOpenPageViews(supabase, body.session_id);
        const { error } = await supabase.from("analytics_page_views").insert({
          session_id: body.session_id,
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
        await applyActivePing(supabase, body.session_id, ev.path, d);
        break;
      }
      case "page_end": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        const { data: row } = await supabase
          .from("analytics_page_views")
          .select("id")
          .eq("session_id", body.session_id)
          .eq("path", ev.path)
          .is("ended_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (row?.id) {
          await supabase
            .from("analytics_page_views")
            .update({ ended_at: new Date().toISOString() })
            .eq("id", row.id);
        }
        break;
      }
      case "click": {
        if (!validPath(ev.path)) return badRequest("Invalid path", origin);
        const label = (ev.element_label ?? "").toString().slice(0, MAX_LABEL_LEN);
        const et = (ev.element_type ?? "unknown").toString().slice(0, 40);
        const tk = ev.track_key ? String(ev.track_key).slice(0, MAX_TRACK_KEY_LEN) : null;
        const tu = ev.target_url ? String(ev.target_url).slice(0, MAX_URL_LEN) : null;
        const { error } = await supabase.from("analytics_click_events").insert({
          session_id: body.session_id,
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
