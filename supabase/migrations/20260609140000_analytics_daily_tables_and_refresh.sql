-- analytics_daily_* were implemented as VIEWs in 20260609120000; external sync / ETL often runs
-- DELETE on these objects → PostgreSQL error: "cannot delete from view".
-- Replace with physical tables + a SECURITY DEFINER refresh that rebuilds rows from raw analytics.
--
-- After migrate: call public.refresh_analytics_daily_rollups(from, to) (optionally per web_id),
-- e.g. nightly via pg_cron or after bulk imports.

drop view if exists public.analytics_daily_source_breakdown cascade;
drop view if exists public.analytics_daily_utm cascade;

create table if not exists public.analytics_daily_source_breakdown (
  web_id text not null,
  day date not null,
  source_key text not null,
  sessions_count bigint not null default 0,
  primary key (web_id, day, source_key),
  constraint analytics_daily_source_breakdown_web_id_check
    check (web_id in ('vialdi', 'vialdi-wedding', 'synckerja')),
  constraint analytics_daily_source_breakdown_source_key_check
    check (source_key in ('direct', 'utm', 'referral', 'paid_click_ids'))
);

create index if not exists idx_analytics_daily_source_breakdown_web_day
  on public.analytics_daily_source_breakdown (web_id, day desc);

create table if not exists public.analytics_daily_utm (
  web_id text not null,
  day date not null,
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  utm_content text not null default '',
  utm_term text not null default '',
  sessions_count bigint not null default 0,
  primary key (web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term),
  constraint analytics_daily_utm_web_id_check
    check (web_id in ('vialdi', 'vialdi-wedding', 'synckerja'))
);

create index if not exists idx_analytics_daily_utm_web_day
  on public.analytics_daily_utm (web_id, day desc);

comment on table public.analytics_daily_source_breakdown is
  'Daily session counts by acquisition bucket (rebuilt by refresh_analytics_daily_rollups). Writable for sync DELETE+INSERT if desired; prefer calling refresh for correctness.';

comment on table public.analytics_daily_utm is
  'Daily UTM rollup for sessions with at least one parsed UTM dimension (rebuilt by refresh). No "all empty" rows.';

alter table public.analytics_daily_source_breakdown enable row level security;
alter table public.analytics_daily_utm enable row level security;

drop policy if exists "analytics_daily_source_breakdown_select_admin"
  on public.analytics_daily_source_breakdown;
create policy "analytics_daily_source_breakdown_select_admin"
  on public.analytics_daily_source_breakdown for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "analytics_daily_utm_select_admin"
  on public.analytics_daily_utm;
create policy "analytics_daily_utm_select_admin"
  on public.analytics_daily_utm for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

grant select on public.analytics_daily_source_breakdown to authenticated;
grant select on public.analytics_daily_utm to authenticated;

create or replace function public.refresh_analytics_daily_rollups(
  p_from date,
  p_to date default null,
  p_web_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_to date;
begin
  v_to := coalesce(p_to, p_from);
  if p_from > v_to then
    raise exception 'invalid date range' using errcode = '22023';
  end if;

  if p_web_id is not null
    and (btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja')) then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  delete from public.analytics_daily_source_breakdown d
  where d.day between p_from and v_to
    and (p_web_id is null or d.web_id = p_web_id);

  delete from public.analytics_daily_utm u
  where u.day between p_from and v_to
    and (p_web_id is null or u.web_id = p_web_id);

  insert into public.analytics_daily_source_breakdown (web_id, day, source_key, sessions_count)
  with human_sessions as (
    select distinct
      pv.web_id,
      pv.session_id,
      (pv.started_at at time zone 'Asia/Jakarta')::date as day
    from public.analytics_page_views pv
    where
      (p_web_id is null or pv.web_id = p_web_id)
      and (
        coalesce(pv.active_ms, 0) > 0
        or coalesce(pv.scroll_max_pct, 0) >= 5
        or (
          pv.ended_at is not null
          and extract(epoch from (pv.ended_at - pv.started_at)) >= 5
        )
      )
  ),
  base as (
    select
      hs.web_id,
      hs.day,
      hs.session_id,
      s.referrer,
      s.landing_url,
      s.utm_source,
      s.utm_medium,
      s.utm_campaign,
      s.utm_content,
      s.utm_term,
      s.has_gclid,
      s.has_fbclid,
      s.has_msclkid,
      s.has_gbraid,
      s.has_wbraid,
      lower(coalesce(s.landing_url, '')) ~ '[?&]utm_(source|medium|campaign|content|term)=' as landing_has_utm
    from human_sessions hs
    inner join public.analytics_sessions s
      on s.id = hs.session_id
      and s.web_id = hs.web_id
  ),
  classified as (
    select
      web_id,
      day,
      session_id,
      case
        when has_gclid or has_fbclid or has_msclkid or has_gbraid or has_wbraid then 'paid_click_ids'
        when
          nullif(btrim(utm_source), '') is not null
          or nullif(btrim(utm_medium), '') is not null
          or nullif(btrim(utm_campaign), '') is not null
          or nullif(btrim(utm_content), '') is not null
          or nullif(btrim(utm_term), '') is not null
          or landing_has_utm
          then 'utm'
        when nullif(btrim(referrer), '') is not null then 'referral'
        else 'direct'
      end as source_key
    from base
  )
  select
    web_id,
    day,
    source_key,
    count(*)::bigint as sessions_count
  from classified
  where day between p_from and v_to
  group by web_id, day, source_key;

  insert into public.analytics_daily_utm (
    web_id,
    day,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    sessions_count
  )
  with human_sessions as (
    select distinct
      pv.web_id,
      pv.session_id,
      (pv.started_at at time zone 'Asia/Jakarta')::date as day
    from public.analytics_page_views pv
    where
      (p_web_id is null or pv.web_id = p_web_id)
      and (
        coalesce(pv.active_ms, 0) > 0
        or coalesce(pv.scroll_max_pct, 0) >= 5
        or (
          pv.ended_at is not null
          and extract(epoch from (pv.ended_at - pv.started_at)) >= 5
        )
      )
  ),
  base as (
    select
      hs.web_id,
      hs.day,
      hs.session_id,
      s.landing_url,
      s.utm_source,
      s.utm_medium,
      s.utm_campaign,
      s.utm_content,
      s.utm_term,
      s.has_gclid,
      s.has_fbclid,
      s.has_msclkid,
      s.has_gbraid,
      s.has_wbraid,
      s.referrer,
      lower(coalesce(s.landing_url, '')) ~ '[?&]utm_(source|medium|campaign|content|term)=' as landing_has_utm
    from human_sessions hs
    inner join public.analytics_sessions s
      on s.id = hs.session_id
      and s.web_id = hs.web_id
  ),
  effective as (
    select
      web_id,
      day,
      session_id,
      coalesce(
        nullif(btrim(utm_source), ''),
        nullif(
          trim((regexp_match(coalesce(landing_url, ''), '(?i)[?&]utm_source=([^&]*)'))[1]),
          ''
        )
      ) as utm_source_eff,
      coalesce(
        nullif(btrim(utm_medium), ''),
        nullif(
          trim((regexp_match(coalesce(landing_url, ''), '(?i)[?&]utm_medium=([^&]*)'))[1]),
          ''
        )
      ) as utm_medium_eff,
      coalesce(
        nullif(btrim(utm_campaign), ''),
        nullif(
          trim((regexp_match(coalesce(landing_url, ''), '(?i)[?&]utm_campaign=([^&]*)'))[1]),
          ''
        )
      ) as utm_campaign_eff,
      coalesce(
        nullif(btrim(utm_content), ''),
        nullif(
          trim((regexp_match(coalesce(landing_url, ''), '(?i)[?&]utm_content=([^&]*)'))[1]),
          ''
        )
      ) as utm_content_eff,
      coalesce(
        nullif(btrim(utm_term), ''),
        nullif(
          trim((regexp_match(coalesce(landing_url, ''), '(?i)[?&]utm_term=([^&]*)'))[1]),
          ''
        )
      ) as utm_term_eff,
      has_gclid,
      has_fbclid,
      has_msclkid,
      has_gbraid,
      has_wbraid,
      landing_has_utm,
      referrer
    from base
  ),
  classified as (
    select
      *,
      case
        when has_gclid or has_fbclid or has_msclkid or has_gbraid or has_wbraid then 'paid_click_ids'
        when
          nullif(btrim(utm_source_eff), '') is not null
          or nullif(btrim(utm_medium_eff), '') is not null
          or nullif(btrim(utm_campaign_eff), '') is not null
          or nullif(btrim(utm_content_eff), '') is not null
          or nullif(btrim(utm_term_eff), '') is not null
          or landing_has_utm
          then 'utm'
        when nullif(btrim(referrer), '') is not null then 'referral'
        else 'direct'
      end as source_key
    from effective
  ),
  utm_rows as (
    select
      web_id,
      day,
      coalesce(utm_source_eff, '') as utm_source,
      coalesce(utm_medium_eff, '') as utm_medium,
      coalesce(utm_campaign_eff, '') as utm_campaign,
      coalesce(utm_content_eff, '') as utm_content,
      coalesce(utm_term_eff, '') as utm_term
    from classified
    where
      day between p_from and v_to
      and source_key in ('utm', 'paid_click_ids')
      and (
        nullif(btrim(utm_source_eff), '') is not null
        or nullif(btrim(utm_medium_eff), '') is not null
        or nullif(btrim(utm_campaign_eff), '') is not null
        or nullif(btrim(utm_content_eff), '') is not null
        or nullif(btrim(utm_term_eff), '') is not null
      )
  )
  select
    web_id,
    day,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    count(*)::bigint as sessions_count
  from utm_rows
  group by web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term;
end;
$body$;

revoke all on function public.refresh_analytics_daily_rollups(date, date, text) from public;
grant execute on function public.refresh_analytics_daily_rollups(date, date, text) to service_role;

comment on function public.refresh_analytics_daily_rollups(date, date, text) is
  'Rebuild analytics_daily_source_breakdown and analytics_daily_utm for [p_from, p_to] (Asia/Jakarta calendar days on page_views). Pass p_web_id to scope one property; NULL = all.';
