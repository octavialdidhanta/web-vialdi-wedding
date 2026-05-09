-- Replace legacy rollup tables (if any) with views so each session is counted in exactly one
-- source bucket per day, and UTM daily rows never represent "fake direct" (empty UTM dims).
--
-- Classification priority (same spirit as admin_analytics_summary):
--   1) paid_click_ids — any ad click id flag on session
--   2) utm — utm_* columns OR landing_url query contains utm_* (case-insensitive param name)
--   3) referral — non-empty referrer
--   4) direct
--
-- Only sessions with at least one "human" page view on that calendar day (Asia/Jakarta)
-- are included (aligned with filter_human_visitors heuristic).

do $migrate$
declare
  rk "char";
begin
  select c.relkind
    into rk
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'analytics_daily_source_breakdown';

  if rk = 'v' then
    execute 'drop view public.analytics_daily_source_breakdown cascade';
  elsif rk = 'r' then
    execute 'alter table public.analytics_daily_source_breakdown rename to analytics_daily_source_breakdown_legacy';
  end if;

  select c.relkind
    into rk
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'analytics_daily_utm';

  if rk = 'v' then
    execute 'drop view public.analytics_daily_utm cascade';
  elsif rk = 'r' then
    execute 'alter table public.analytics_daily_utm rename to analytics_daily_utm_legacy';
  end if;
end
$migrate$;

create or replace view public.analytics_daily_source_breakdown as
with human_sessions as (
  select distinct
    pv.web_id,
    pv.session_id,
    (pv.started_at at time zone 'Asia/Jakarta')::date as day
  from public.analytics_page_views pv
  where
    (
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
group by web_id, day, source_key;

comment on view public.analytics_daily_source_breakdown is
  'Per calendar day (Asia/Jakarta): session counts by single acquisition bucket. Human sessions only. Replaces error-prone incremental rollup tables.';

create or replace view public.analytics_daily_utm as
with human_sessions as (
  select distinct
    pv.web_id,
    pv.session_id,
    (pv.started_at at time zone 'Asia/Jakarta')::date as day
  from public.analytics_page_views pv
  where
    (
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
)
select
  web_id,
  day,
  utm_source_eff as utm_source,
  utm_medium_eff as utm_medium,
  utm_campaign_eff as utm_campaign,
  utm_content_eff as utm_content,
  utm_term_eff as utm_term,
  count(*)::bigint as sessions_count
from classified
where
  source_key in ('utm', 'paid_click_ids')
  and (
    nullif(btrim(utm_source_eff), '') is not null
    or nullif(btrim(utm_medium_eff), '') is not null
    or nullif(btrim(utm_campaign_eff), '') is not null
    or nullif(btrim(utm_content_eff), '') is not null
    or nullif(btrim(utm_term_eff), '') is not null
  )
group by web_id, day, utm_source_eff, utm_medium_eff, utm_campaign_eff, utm_content_eff, utm_term_eff;

comment on view public.analytics_daily_utm is
  'Per day: UTM rollup for sessions with at least one effective UTM dimension (columns or landing_url). Includes paid_click_ids when UTM params exist. Excludes direct/referral-only sessions and rows with no UTM data.';

grant select on public.analytics_daily_source_breakdown to authenticated;
grant select on public.analytics_daily_utm to authenticated;
