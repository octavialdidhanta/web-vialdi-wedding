-- Fix "duplicate key violates unique constraint analytics_daily_utm_pkey1" on sync:
-- - Table may have been altered in Dashboard (extra PK, wrong columns, route in key).
-- - Drop all primary keys on analytics_daily_utm, dedupe to grain (web_id, day, 5×utm),
--   re-add canonical PK, and make refresh INSERT resilient with ON CONFLICT.

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.analytics_daily_utm'::regclass
      and c.contype = 'p'
  loop
    execute format(
      'alter table public.analytics_daily_utm drop constraint %I cascade',
      r.conname
    );
  end loop;
end $$;

-- Optional column from manual UI changes: keep it out of the PK; refresh does not populate it.
alter table public.analytics_daily_utm
  add column if not exists route text not null default '';

drop table if exists public._analytics_daily_utm_deduped;

create table public._analytics_daily_utm_deduped (
  web_id text not null,
  day date not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text not null,
  utm_term text not null,
  sessions_count bigint not null
);

insert into public._analytics_daily_utm_deduped (
  web_id,
  day,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  sessions_count
)
select
  web_id,
  day,
  coalesce(utm_source, '') as utm_source,
  coalesce(utm_medium, '') as utm_medium,
  coalesce(utm_campaign, '') as utm_campaign,
  coalesce(utm_content, '') as utm_content,
  coalesce(utm_term, '') as utm_term,
  sum(sessions_count)::bigint as sessions_count
from public.analytics_daily_utm
group by
  web_id,
  day,
  coalesce(utm_source, ''),
  coalesce(utm_medium, ''),
  coalesce(utm_campaign, ''),
  coalesce(utm_content, ''),
  coalesce(utm_term, '');

truncate table public.analytics_daily_utm;

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
select
  web_id,
  day,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  sessions_count
from public._analytics_daily_utm_deduped;

drop table public._analytics_daily_utm_deduped;

-- Clear any leftover PK / index name so ADD PRIMARY KEY does not fail with 42P07
-- ("relation analytics_daily_utm_pkey already exists") after a partial run or Dashboard edits.
alter table public.analytics_daily_utm
  drop constraint if exists analytics_daily_utm_pkey cascade;
alter table public.analytics_daily_utm
  drop constraint if exists analytics_daily_utm_pkey1 cascade;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.analytics_daily_utm'::regclass
      and c.contype = 'p'
  loop
    execute format(
      'alter table public.analytics_daily_utm drop constraint %I cascade',
      r.conname
    );
  end loop;
end $$;

drop index if exists public.analytics_daily_utm_pkey;

alter table public.analytics_daily_utm
  add constraint analytics_daily_utm_pkey
  primary key (web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term);

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
      (
        nullif(
          trim((regexp_match(coalesce(s.landing_url, ''), '(?i)[?&]utm_source=([^&]*)'))[1]),
          ''
        ) is not null
        or nullif(
          trim((regexp_match(coalesce(s.landing_url, ''), '(?i)[?&]utm_medium=([^&]*)'))[1]),
          ''
        ) is not null
        or nullif(
          trim((regexp_match(coalesce(s.landing_url, ''), '(?i)[?&]utm_campaign=([^&]*)'))[1]),
          ''
        ) is not null
        or nullif(
          trim((regexp_match(coalesce(s.landing_url, ''), '(?i)[?&]utm_content=([^&]*)'))[1]),
          ''
        ) is not null
        or nullif(
          trim((regexp_match(coalesce(s.landing_url, ''), '(?i)[?&]utm_term=([^&]*)'))[1]),
          ''
        ) is not null
      ) as landing_utm_any_parsed
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
          or landing_utm_any_parsed
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
      s.referrer
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
  group by web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term
  on conflict (web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  do update set sessions_count = excluded.sessions_count;
end;
$body$;

revoke all on function public.refresh_analytics_daily_rollups(date, date, text) from public;
grant execute on function public.refresh_analytics_daily_rollups(date, date, text) to service_role;

comment on function public.refresh_analytics_daily_rollups(date, date, text) is
  'Rebuild analytics_daily_* rollups; UTM insert uses ON CONFLICT to tolerate concurrent refresh / odd PK state.';
