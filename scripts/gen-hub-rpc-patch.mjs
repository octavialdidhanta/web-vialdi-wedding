import fs from "fs";
import path from "path";

const migDir = path.join("supabase", "migrations");

function extractCreateOrReplace(sql, fnName) {
  const re = new RegExp(
    `create or replace function public\\.${fnName}[\\s\\S]*?\\n\\$body\\$;|create or replace function public\\.${fnName}[\\s\\S]*?\\nend;\\s*\\$\\$;?`,
    "i",
  );
  const m = sql.match(re);
  return m ? m[0] : null;
}

/** PostgreSQL requires `;` immediately after closing `$$` on CREATE FUNCTION. */
function ensureDollarQuoteTerminator(sql) {
  return sql.replace(/\n\$\$\s*$/m, "\n$$;");
}

const touchSrc = fs.readFileSync(
  path.join(migDir, "20260609210000_analytics_sessions_visitor_id_not_null.sql"),
  "utf8",
);
let touch = extractCreateOrReplace(touchSrc, "analytics_session_touch");
if (!touch) throw new Error("analytics_session_touch not found");
touch = touch.replace(
  /declare\s+v_visitor text;/,
  "declare\n  v_visitor text;\n  v_web text;",
).replace(
  /if p_web_id is null or btrim\(p_web_id\) = '' or p_web_id not in \('vialdi', 'vialdi-wedding', 'synckerja'\) then\s+raise exception 'invalid web_id' using errcode = '22023';\s+end if;/,
  "v_web := public.hub_require_active_web_id(p_web_id, false);",
).replace(/^\s+p_web_id,$/m, "    v_web,");

const grainSrc = fs.readFileSync(
  path.join(migDir, "20260609200000_analytics_daily_utm_route_grain.sql"),
  "utf8",
);

let refresh = extractCreateOrReplace(grainSrc, "refresh_analytics_daily_rollups");
if (!refresh) throw new Error("refresh not found");
refresh = refresh.replace(
  /declare\s+v_to date;/,
  "declare\n  v_to date;\n  v_web text;",
).replace(
  /if p_web_id is not null\s+and \(btrim\(p_web_id\) = '' or p_web_id not in \('vialdi', 'vialdi-wedding', 'synckerja'\)\) then\s+raise exception 'invalid web_id' using errcode = '22023';\s+end if;/,
  "v_web := public.hub_require_active_web_id(p_web_id, true);",
).replaceAll("(p_web_id is null or ", "(v_web is null or ")
  .replaceAll("d.web_id = p_web_id", "d.web_id = v_web")
  .replaceAll("u.web_id = p_web_id", "u.web_id = v_web")
  .replaceAll("pv.web_id = p_web_id", "pv.web_id = v_web");

let dash = extractCreateOrReplace(grainSrc, "get_traffic_dashboard");
if (!dash) throw new Error("get_traffic_dashboard not found");
dash = dash.replace(
  /w := nullif\(btrim\(p_web_id\), ''\);\s+if w is not null and w not in \('vialdi', 'vialdi-wedding', 'synckerja'\) then\s+raise exception 'invalid web_id' using errcode = '22023';\s+end if;/,
  "w := public.hub_require_active_web_id(p_web_id, true);",
);

const adminSrc = fs.readFileSync(
  path.join(migDir, "20260611150000_admin_analytics_headline_totals_raw.sql"),
  "utf8",
);
let admin = extractCreateOrReplace(adminSrc, "admin_analytics_summary");
if (!admin) throw new Error("admin_analytics_summary not found");
admin = admin.replace(
  /declare\s+v_daily jsonb;/,
  "declare\n  v_web_id text;\n  v_daily jsonb;",
).replace(
  /if p_web_id is null or btrim\(p_web_id\) = '' or p_web_id not in \('vialdi', 'vialdi-wedding', 'synckerja'\) then\s+raise exception 'invalid web_id' using errcode = '22023';\s+end if;/,
  "v_web_id := public.hub_require_active_web_id(p_web_id, false);",
).replaceAll("web_id = p_web_id", "web_id = v_web_id");
dash = ensureDollarQuoteTerminator(dash);
admin = ensureDollarQuoteTerminator(admin);

const out =
  "-- Hub: patch RPCs to use hub_require_active_web_id (requires 20260620101000)\n\n" +
  touch +
  "\n\n" +
  refresh +
  "\n\n" +
  dash +
  "\n\n" +
  admin;

fs.writeFileSync(path.join(migDir, "20260620101100_hub_rpc_web_id_patches.sql"), out, "utf8");
console.log("Wrote hub RPC patch", out.length, "chars");
