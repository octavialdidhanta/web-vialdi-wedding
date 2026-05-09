/**
 * Edge: traffic-refresh-rollups
 *
 * CMS-only: rebuild public.analytics_daily_source_breakdown + public.analytics_daily_utm
 * via public.refresh_analytics_daily_rollups (see migration 20260609140000).
 *
 * POST JSON body (all optional):
 * - p_from: "YYYY-MM-DD" (default: 35 days ago, UTC calendar)
 * - p_to: "YYYY-MM-DD" or null (default: null → RPC uses single day p_from if only p_from set; else today UTC)
 * - p_web_id: "vialdi-wedding" | null for all
 *
 * Requires: authenticated user in public.cms_admins.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_WEB_IDS = ["vialdi", "vialdi-wedding", "synckerja"] as const;

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

function corsPreflight(origin: string | null): HeadersInit {
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

function parseYmd(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function defaultFromYmd(): string {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() - 35);
  return t.toISOString().slice(0, 10);
}

function defaultToYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeWebId(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s === "") return null;
  if (!(ALLOWED_WEB_IDS as readonly string[]).includes(s)) return null;
  return s;
}

function mustGetEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v?.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsPreflight(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization" }, { status: 401, headers: corsHeaders(origin) });
    }

    const url = mustGetEnv("SUPABASE_URL");
    const anonKey = mustGetEnv("SUPABASE_ANON_KEY");
    const serviceKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return json({ error: "Invalid session", detail: userErr?.message }, {
        status: 401,
        headers: corsHeaders(origin),
      });
    }
    const userId = userData.user.id;

    const service = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRow, error: adminErr } = await service
      .from("cms_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminErr) {
      console.error("cms_admins", adminErr);
      return json({ error: "Admin check failed", detail: adminErr.message }, {
        status: 500,
        headers: corsHeaders(origin),
      });
    }
    if (!adminRow) {
      return json({ error: "Forbidden" }, { status: 403, headers: corsHeaders(origin) });
    }

    let body: { p_from?: unknown; p_to?: unknown; p_web_id?: unknown } = {};
    try {
      const text = await req.text();
      if (text?.trim()) body = JSON.parse(text) as typeof body;
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders(origin) });
    }

    const p_from = parseYmd(body.p_from) ?? defaultFromYmd();
    const p_to =
      body.p_to === undefined
        ? defaultToYmd()
        : body.p_to === null
          ? null
          : parseYmd(body.p_to);
    if (body.p_to !== undefined && body.p_to !== null && p_to === null) {
      return json({ error: "Invalid p_to date" }, { status: 400, headers: corsHeaders(origin) });
    }

    const p_web_id = normalizeWebId(body.p_web_id);

    const rpcArgs: { p_from: string; p_to: string | null; p_web_id: string | null } = {
      p_from,
      p_to: p_to ?? null,
      p_web_id,
    };

    const { error: rpcErr } = await service.rpc("refresh_analytics_daily_rollups", rpcArgs);

    if (rpcErr) {
      console.error("refresh_analytics_daily_rollups", rpcErr);
      return json(
        {
          error: "Refresh failed",
          detail: rpcErr.message,
          hint:
            "Pastikan migrasi 20260609140000 sudah dijalankan (tabel + fungsi refresh_analytics_daily_rollups).",
        },
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    return json({ ok: true, ...rpcArgs }, { status: 200, headers: corsHeaders(origin) });
  } catch (e) {
    console.error("traffic-refresh-rollups", e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Internal error", detail: msg }, { status: 500, headers: corsHeaders(origin) });
  }
});
