/**
 * Edge: traffic-refresh-rollups
 *
 * Rebuild `public.analytics_daily_source_breakdown` + `public.analytics_daily_utm`
 * via `public.refresh_analytics_daily_rollups` (see migration 20260609140000+).
 *
 * Auth (either):
 * - User in `public.cms_admins` (service-role lookup), or
 * - Legacy: active org owner/admin (or org creator) + row in `analytics_web_access` for the web_id.
 *
 * POST JSON — bentuk baru (opsional):
 * - p_from, p_to (YYYY-MM-DD; p_to null = satu hari p_from di RPC)
 * - p_web_id: "vialdi-wedding" | "synckerja" | null (semua web yang valid di RPC)
 *
 * Bentuk lama (kompatibel):
 * - web_id (wajib untuk mode "Maximum" tanpa tanggal)
 * - from, to (YYYY-MM-DD; keduanya di-omit / null = mode Maximum per raw WIB — butuh RPC `get_traffic_raw_wib_bounds`)
 *
 * Mode default (tanpa tanggal, tanpa kunci `web_id` lama): p_from ≈ 35 hari lalu UTC, p_to hari ini, p_web_id opsional.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveActiveProperty } from "../../functions/_shared/resolveWebId.ts";

type ServiceClient = ReturnType<typeof createClient>;

type PgLikeErr = { message?: string; code?: string; details?: string; hint?: string };

type Classified =
  | { kind: "legacy_maximum"; web_id_lower: string }
  | { kind: "new_default_all" }
  | { kind: "new_default_web"; p_web_id: string | null }
  | { kind: "explicit"; p_from: string; p_to: string | null; p_web_id: string | null }
  | { kind: "error"; status: number; message: string };

function hasKey(obj: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, k);
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

/** Parse raw web_id from body (allowlist checked via `properties` before RPC). */
function parseWebIdRaw(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s || null;
}

/** Untuk lookup `analytics_web_access` (lowercase). */
function normalizeWebIdLegacyLookup(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

async function resolveWebIdForRpc(
  service: ServiceClient,
  raw: string | null,
): Promise<string | null> {
  if (!raw) return null;
  const r = await resolveActiveProperty(service, raw);
  if (!r.ok) return null;
  return r.property.slug;
}

function mustGetEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v?.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function isMissingPostgresRoutine(err: PgLikeErr | null): boolean {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  const c = String(err.code ?? "");
  if (c === "P0001") return false;
  if (c === "42883") return true;
  if (m.includes("could not find") && m.includes("function")) return true;
  if (m.includes("does not exist") && m.includes("function")) return true;
  return false;
}

function classifyBody(body: Record<string, unknown>): Classified {
  const datesKeys = hasKey(body, "p_from") || hasKey(body, "p_to") || hasKey(body, "from") || hasKey(body, "to");

  if (!datesKeys) {
    if (hasKey(body, "web_id") && !hasKey(body, "p_web_id")) {
      const w = normalizeWebIdLegacyLookup(body.web_id);
      if (!w) return { kind: "error", status: 400, message: "web_id is required" };
      return { kind: "legacy_maximum", web_id_lower: w };
    }
    if (hasKey(body, "p_web_id")) {
      const pw = parseWebIdRaw(body.p_web_id);
      if (body.p_web_id != null && String(body.p_web_id).trim() !== "" && !pw) {
        return { kind: "error", status: 400, message: "Invalid p_web_id" };
      }
      return { kind: "new_default_web", p_web_id: pw };
    }
    return { kind: "new_default_all" };
  }

  const legacyOnlyDates = (hasKey(body, "from") || hasKey(body, "to")) && !hasKey(body, "p_from") && !hasKey(body, "p_to");

  if (legacyOnlyDates) {
    const coalesceNull = (v: unknown) => {
      if (v === undefined || v === null) return null;
      if (typeof v === "string" && v.trim() === "") return null;
      return typeof v === "string" ? v.trim() : String(v);
    };
    const f = coalesceNull(body.from);
    const t = coalesceNull(body.to);
    if (!f || !t) {
      return {
        kind: "error",
        status: 400,
        message: "from/to are required unless both are omitted/null (Maximum)",
      };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || !/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return { kind: "error", status: 400, message: "Invalid from/to format" };
    }
    if (t < f) return { kind: "error", status: 400, message: "Invalid range" };
    const pw = hasKey(body, "p_web_id")
      ? parseWebIdRaw(body.p_web_id)
      : hasKey(body, "web_id")
        ? parseWebIdRaw(body.web_id)
        : null;
    return { kind: "explicit", p_from: f, p_to: t, p_web_id: pw };
  }

  const startRaw = hasKey(body, "p_from") ? body.p_from : hasKey(body, "from") ? body.from : undefined;
  const hasStart = hasKey(body, "p_from") || hasKey(body, "from");
  const hasEnd = hasKey(body, "p_to") || hasKey(body, "to");

  if (!hasStart && hasEnd) {
    return { kind: "error", status: 400, message: "Missing p_from / from" };
  }

  const p_from = parseYmd(startRaw);
  if (hasStart && !p_from) return { kind: "error", status: 400, message: "Invalid p_from / from date" };

  let p_to: string | null;
  if (hasKey(body, "p_to") && body.p_to === null) {
    p_to = null;
  } else if (hasEnd) {
    const endRaw = hasKey(body, "p_to") ? body.p_to : body.to;
    p_to = parseYmd(endRaw);
    if (p_to === null) return { kind: "error", status: 400, message: "Invalid p_to / to date" };
  } else {
    p_to = defaultToYmd();
  }

  const effFrom = p_from ?? defaultFromYmd();
  const pw = hasKey(body, "p_web_id")
    ? parseWebIdRaw(body.p_web_id)
    : hasKey(body, "web_id")
      ? parseWebIdRaw(body.web_id)
      : null;
  if (hasKey(body, "p_web_id") && body.p_web_id != null && String(body.p_web_id).trim() !== "" && !pw) {
    return { kind: "error", status: 400, message: "Invalid p_web_id" };
  }

  return { kind: "explicit", p_from: effFrom, p_to, p_web_id: pw };
}

type WibBounds = { day_min?: string; day_max?: string };

type AuthContext =
  | { kind: "cms_admin" }
  | { kind: "org"; organizationId: string; userId: string };

async function resolveAuthContext(
  service: ServiceClient,
  userId: string,
): Promise<AuthContext | { error: string; status: number }> {
  const { data: adminRow, error: adminErr } = await service
    .from("cms_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminErr) {
    console.error("cms_admins", adminErr);
    return { error: adminErr.message, status: 500 };
  }
  if (adminRow) return { kind: "cms_admin" };

  const { data: profile, error: profileErr } = await service
    .from("profiles")
    .select("active_organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileErr) return { error: profileErr.message, status: 500 };
  const orgId = (profile as { active_organization_id?: string } | null)?.active_organization_id ?? null;
  if (!orgId) return { error: "No active organization", status: 403 };

  const { data: roleRow, error: roleErr } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .limit(50);
  if (roleErr) return { error: roleErr.message, status: 500 };

  const roles = (roleRow ?? []) as Array<{ role?: string }>;
  const role =
    roles.find((r) => r.role === "owner")?.role ??
    roles.find((r) => r.role === "admin")?.role ??
    null;
  let canRefresh = role === "owner" || role === "admin";
  if (!canRefresh) {
    const { data: orgGate, error: orgGateErr } = await service
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .or(`user_id.eq.${userId},created_by.eq.${userId}`)
      .maybeSingle();
    if (orgGateErr) return { error: orgGateErr.message, status: 500 };
    canRefresh = Boolean(orgGate?.id);
  }
  if (!canRefresh) {
    return { error: "Only owner/admin can refresh rollups", status: 403 };
  }

  return { kind: "org", organizationId: orgId, userId };
}

async function resolveOrgWebAccessCanonical(args: {
  service: ServiceClient;
  organizationId: string;
  webIdLower: string;
}): Promise<{ ok: true; canonical_web_id: string } | { ok: false; status: number; message: string }> {
  const { data: mapping, error: mapErr } = await args.service
    .from("analytics_web_access")
    .select("web_id")
    .eq("organization_id", args.organizationId)
    .eq("web_id", args.webIdLower)
    .maybeSingle();
  if (mapErr) return { ok: false, status: 500, message: mapErr.message };
  if (!mapping?.web_id) {
    return { ok: false, status: 403, message: "web_id is not connected for this org" };
  }
  return { ok: true, canonical_web_id: String(mapping.web_id).trim() };
}

/** Untuk jalur org: canonical dari analytics_web_access (validated via properties di RPC). */
function rpcWebIdForPostgres(canonicalFromDb: string): string | null {
  const t = canonicalFromDb.trim();
  return t || null;
}

/** Wajib untuk user org (selain mode legacy_maximum yang sudah diverifikasi). */
async function gateOrgWebAccess(
  service: ServiceClient,
  organizationId: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; p_web_id: string } | { ok: false; status: number; message: string }> {
  const raw = hasKey(body, "p_web_id") ? body.p_web_id : hasKey(body, "web_id") ? body.web_id : undefined;
  if (raw === undefined || raw === null || (typeof raw === "string" && !raw.trim())) {
    return { ok: false, status: 400, message: "web_id is required" };
  }
  const acc = await resolveOrgWebAccessCanonical({
    service,
    organizationId,
    webIdLower: normalizeWebIdLegacyLookup(raw),
  });
  if (!acc.ok) return { ok: false, status: acc.status, message: acc.message };
  const mapped = rpcWebIdForPostgres(acc.canonical_web_id);
  if (!mapped) return { ok: false, status: 400, message: "Invalid web_id mapping" };
  return { ok: true, p_web_id: mapped };
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
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return json({ error: "Missing auth token" }, { status: 401, headers: corsHeaders(origin) });

    const url = mustGetEnv("SUPABASE_URL");
    const serviceKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");

    const service = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await service.auth.getUser(token);
    if (userErr || !userRes?.user?.id) {
      return json(
        { error: "Invalid session", detail: userErr?.message ?? "Invalid auth token" },
        { status: 401, headers: corsHeaders(origin) },
      );
    }
    const userId = userRes.user.id;

    const authCtx = await resolveAuthContext(service, userId);
    if ("error" in authCtx) {
      return json({ error: authCtx.error }, { status: authCtx.status, headers: corsHeaders(origin) });
    }

    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      if (text?.trim()) body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders(origin) });
    }

    const classified = classifyBody(body);
    if (classified.kind === "error") {
      return json({ error: classified.message }, { status: classified.status, headers: corsHeaders(origin) });
    }

    let p_from: string;
    let p_to: string | null;
    let p_web_id: string | null;
    let mode: string;

    if (classified.kind === "legacy_maximum") {
      mode = "legacy_maximum";
      if (authCtx.kind === "org") {
        const acc = await resolveOrgWebAccessCanonical({
          service,
          organizationId: authCtx.organizationId,
          webIdLower: classified.web_id_lower,
        });
        if (!acc.ok) {
          return json({ error: acc.message }, { status: acc.status, headers: corsHeaders(origin) });
        }
        p_web_id = rpcWebIdForPostgres(acc.canonical_web_id);
      } else {
        const n = await resolveWebIdForRpc(service, classified.web_id_lower);
        if (!n) {
          return json({ error: "Invalid web_id for refresh" }, { status: 400, headers: corsHeaders(origin) });
        }
        p_web_id = n;
      }

      const { data: boundsRaw, error: boundsErr } = await service.rpc("get_traffic_raw_wib_bounds", {
        p_web_id: p_web_id,
      });
      if (boundsErr) {
        if (isMissingPostgresRoutine(boundsErr as PgLikeErr)) {
          return json(
            {
              error: "Maximum mode unavailable",
              detail: "RPC get_traffic_raw_wib_bounds is not installed in this database.",
              hint: "Pass explicit from/to (or p_from/p_to), or add the RPC migration.",
            },
            { status: 400, headers: corsHeaders(origin) },
          );
        }
        return json({ error: "Bounds lookup failed", detail: boundsErr.message }, {
          status: 500,
          headers: corsHeaders(origin),
        });
      }
      const bounds = boundsRaw as WibBounds | null;
      const dmin = bounds?.day_min ? String(bounds.day_min).slice(0, 10) : "";
      const dmax = bounds?.day_max ? String(bounds.day_max).slice(0, 10) : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dmin) || !/^\d{4}-\d{2}-\d{2}$/.test(dmax)) {
        return json(
          {
            error: "No raw analytics events for this web_id; nothing to roll up.",
            step: "bounds",
          },
          { status: 400, headers: corsHeaders(origin) },
        );
      }
      p_from = dmin;
      p_to = dmax;
    } else if (classified.kind === "new_default_all") {
      mode = "default_35d_all";
      p_from = defaultFromYmd();
      p_to = defaultToYmd();
      p_web_id = null;
      if (authCtx.kind === "org") {
        return json(
          { error: "web_id is required for organization users (use p_web_id or legacy web_id)" },
          { status: 400, headers: corsHeaders(origin) },
        );
      }
    } else if (classified.kind === "new_default_web") {
      mode = "default_35d_web";
      p_from = defaultFromYmd();
      p_to = defaultToYmd();
      p_web_id = classified.p_web_id;
      if (authCtx.kind === "org" && !p_web_id) {
        return json({ error: "web_id is required" }, { status: 400, headers: corsHeaders(origin) });
      }
    } else {
      mode = "explicit";
      p_from = classified.p_from;
      p_to = classified.p_to;
      p_web_id = classified.p_web_id;
    }

    if (authCtx.kind === "org" && classified.kind !== "legacy_maximum") {
      const g = await gateOrgWebAccess(service, authCtx.organizationId, body);
      if (!g.ok) {
        return json({ error: g.message }, { status: g.status, headers: corsHeaders(origin) });
      }
      p_web_id = g.p_web_id;
    }

    if (p_web_id) {
      const canonical = await resolveWebIdForRpc(service, p_web_id);
      if (!canonical) {
        return json({ error: "Invalid p_web_id" }, { status: 400, headers: corsHeaders(origin) });
      }
      p_web_id = canonical;
    }

    const rpcArgs = { p_from, p_to: p_to ?? null, p_web_id };

    if (p_web_id) {
      const { error: fullRefreshErr } = await service.rpc("refresh_analytics_rollups", {
        p_web_id,
        p_from: rpcArgs.p_from,
        p_to: rpcArgs.p_to ?? rpcArgs.p_from,
      });
      if (fullRefreshErr && !isMissingPostgresRoutine(fullRefreshErr as PgLikeErr)) {
        console.error("refresh_analytics_rollups", fullRefreshErr);
        return json(
          { error: "refresh_analytics_rollups failed", detail: fullRefreshErr.message },
          { status: 500, headers: corsHeaders(origin) },
        );
      }
    }

    if (p_web_id) {
      const { error: clearRpcErr } = await service.rpc("clear_analytics_rollups_slice_for_traffic_sync", {
        p_web_id,
        p_from: rpcArgs.p_from,
        p_to: rpcArgs.p_to ?? rpcArgs.p_from,
      });
      if (clearRpcErr && !isMissingPostgresRoutine(clearRpcErr as PgLikeErr)) {
        console.error("clear_analytics_rollups_slice_for_traffic_sync", clearRpcErr);
        return json(
          { error: "clear_analytics_rollups_slice_for_traffic_sync failed", detail: clearRpcErr.message },
          { status: 500, headers: corsHeaders(origin) },
        );
      }
      if (clearRpcErr && isMissingPostgresRoutine(clearRpcErr as PgLikeErr)) {
        const rt = rpcArgs.p_to ?? rpcArgs.p_from;
        const { error: clearUtmErr } = await service
          .from("analytics_daily_utm")
          .delete()
          .eq("web_id", p_web_id)
          .gte("day", rpcArgs.p_from)
          .lte("day", rt);
        if (clearUtmErr) {
          console.error("rest_delete_analytics_daily_utm", clearUtmErr);
          return json(
            { error: "rest_delete_analytics_daily_utm failed", detail: clearUtmErr.message },
            { status: 500, headers: corsHeaders(origin) },
          );
        }
        const { error: clearSbErr } = await service
          .from("analytics_daily_source_breakdown")
          .delete()
          .eq("web_id", p_web_id)
          .gte("day", rpcArgs.p_from)
          .lte("day", rt);
        if (clearSbErr) {
          console.error("rest_delete_analytics_daily_source_breakdown", clearSbErr);
          return json(
            { error: "rest_delete_analytics_daily_source_breakdown failed", detail: clearSbErr.message },
            { status: 500, headers: corsHeaders(origin) },
          );
        }
      }
    }

    const { error: rpcErr } = await service.rpc("refresh_analytics_daily_rollups", rpcArgs);

    if (rpcErr) {
      console.error("refresh_analytics_daily_rollups", rpcErr);
      return json(
        {
          error: "Refresh failed",
          detail: rpcErr.message,
          hint:
            "Pastikan migrasi 20260609140000+ sudah dijalankan (tabel + fungsi refresh_analytics_daily_rollups).",
        },
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    return json(
      {
        ok: true,
        success: true,
        mode,
        ...rpcArgs,
        web_id: p_web_id,
      },
      { status: 200, headers: corsHeaders(origin) },
    );
  } catch (e) {
    console.error("traffic-refresh-rollups", e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Internal error", detail: msg }, { status: 500, headers: corsHeaders(origin) });
  }
});
