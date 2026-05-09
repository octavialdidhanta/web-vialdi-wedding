-- RPC for Traffic admin UI: read pre-aggregated daily rollups (rebuilt by refresh_analytics_daily_rollups).
-- Flat args match typical supabase.rpc({ p_from, p_to, p_web_id }) from the client.
-- p_from / p_to: YYYY-MM-DD or ISO datetime (first 10 chars used as date).

create or replace function public.get_traffic_dashboard(
  p_from text,
  p_to text,
  p_web_id text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  d_from date;
  d_to date;
  w text;
begin
  if not exists (select 1 from public.cms_admins c where c.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_from is null or btrim(p_from) = '' or p_to is null or btrim(p_to) = '' then
    raise exception 'p_from and p_to required' using errcode = '22023';
  end if;

  d_from := left(btrim(p_from), 10)::date;
  d_to := left(btrim(p_to), 10)::date;

  if d_to < d_from then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  w := nullif(btrim(p_web_id), '');
  if w is not null and w not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'source_breakdown',
    coalesce(
      (
        select jsonb_agg(to_jsonb(t) order by t.day, t.web_id, t.source_key)
        from (
          select
            sdb.web_id,
            sdb.day,
            sdb.source_key,
            sdb.sessions_count
          from public.analytics_daily_source_breakdown sdb
          where sdb.day between d_from and d_to
            and (w is null or sdb.web_id = w)
        ) t
      ),
      '[]'::jsonb
    ),
    'utm_rows',
    coalesce(
      (
        select jsonb_agg(to_jsonb(u) order by u.day desc, u.sessions_count desc)
        from (
          select
            uu.web_id,
            uu.day,
            uu.utm_source,
            uu.utm_medium,
            uu.utm_campaign,
            uu.utm_content,
            uu.utm_term,
            uu.sessions_count
          from public.analytics_daily_utm uu
          where uu.day between d_from and d_to
            and (w is null or uu.web_id = w)
        ) u
      ),
      '[]'::jsonb
    ),
    'p_from', d_from,
    'p_to', d_to,
    'p_web_id', w
  );
end;
$$;

revoke all on function public.get_traffic_dashboard(text, text, text) from public;
grant execute on function public.get_traffic_dashboard(text, text, text) to authenticated;

comment on function public.get_traffic_dashboard(text, text, text) is
  'CMS Traffic page: JSON with source_breakdown + utm_rows from analytics_daily_* tables for date range. Requires cms_admins.';
