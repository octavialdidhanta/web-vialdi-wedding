-- analytics_daily_utm.route: populate from first qualifying (human) page_view path per session/day.
-- Previously refresh omitted `route` (Dashboard default '' → UI "EMPTY"). Grain is now
-- (web_id, day, 5×utm, route) so the same UTM can split by landing path.
--
-- 20260609120000 may have renamed old physical tables to *_legacy; they can keep the index name
-- analytics_daily_utm_pkey and block DROP INDEX on the current table (2BP01).
drop table if exists public.analytics_daily_utm_legacy cascade;
drop table if exists public.analytics_daily_source_breakdown_legacy cascade;

alter table public.analytics_daily_utm
  add column if not exists route text not null default '/';

update public.analytics_daily_utm
set route = '/'
where btrim(route) = '';

alter table public.analytics_daily_utm
  alter column route set default '/';

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

alter table public.analytics_daily_utm drop constraint if exists analytics_daily_utm_pkey cascade;
alter table public.analytics_daily_utm drop constraint if exists analytics_daily_utm_pkey1 cascade;
drop index if exists public.analytics_daily_utm_pkey;

drop table if exists public._analytics_daily_utm_deduped;

create table public._analytics_daily_utm_deduped (
  web_id text not null,
  day date not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text not null,
  utm_term text not null,
  route text not null,
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
  route,
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
  case
    when nullif(btrim(route), '') is null then '/'
    else left(btrim(route), 2048)
  end as route,
  sum(sessions_count)::bigint as sessions_count
from public.analytics_daily_utm
group by
  web_id,
  day,
  coalesce(utm_source, ''),
  coalesce(utm_medium, ''),
  coalesce(utm_campaign, ''),
  coalesce(utm_content, ''),
  coalesce(utm_term, ''),
  case
    when nullif(btrim(route), '') is null then '/'
    else left(btrim(route), 2048)
  end;

truncate table public.analytics_daily_utm;

insert into public.analytics_daily_utm (
  web_id,
  day,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  route,
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
  route,
  sessions_count
from public._analytics_daily_utm_deduped;

drop table public._analytics_daily_utm_deduped;

alter table public.analytics_daily_utm
  add constraint analytics_daily_utm_pkey
  primary key (
    web_id,
    day,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    route
  );

comment on column public.analytics_daily_utm.route is
  'First human page_view path (Asia/Jakarta day) for sessions in this UTM bucket; "/" if unknown.';

-- ---------------------------------------------------------------------------
-- refresh_analytics_daily_rollups: fill route via first qualifying page_view
-- ---------------------------------------------------------------------------

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
      coalesce(nullif(btrim(s.last_referrer), ''), nullif(btrim(s.referrer), '')) as referrer,
      coalesce(nullif(btrim(s.last_landing_url), ''), nullif(btrim(s.landing_url), '')) as landing_url,
      coalesce(nullif(btrim(s.last_utm_source), ''), nullif(btrim(s.utm_source), '')) as utm_source,
      coalesce(nullif(btrim(s.last_utm_medium), ''), nullif(btrim(s.utm_medium), '')) as utm_medium,
      coalesce(nullif(btrim(s.last_utm_campaign), ''), nullif(btrim(s.utm_campaign), '')) as utm_campaign,
      coalesce(nullif(btrim(s.last_utm_content), ''), nullif(btrim(s.utm_content), '')) as utm_content,
      coalesce(nullif(btrim(s.last_utm_term), ''), nullif(btrim(s.utm_term), '')) as utm_term,
      (coalesce(s.has_gclid, false) or coalesce(s.last_has_gclid, false)) as has_gclid,
      (coalesce(s.has_fbclid, false) or coalesce(s.last_has_fbclid, false)) as has_fbclid,
      (coalesce(s.has_msclkid, false) or coalesce(s.last_has_msclkid, false)) as has_msclkid,
      (coalesce(s.has_gbraid, false) or coalesce(s.last_has_gbraid, false)) as has_gbraid,
      (coalesce(s.has_wbraid, false) or coalesce(s.last_has_wbraid, false)) as has_wbraid,
      (
        nullif(
          trim((
            regexp_match(
              coalesce(
                nullif(btrim(s.last_landing_url), ''),
                nullif(btrim(s.landing_url), ''),
                ''
              ),
              '(?i)[?&]utm_source=([^&]*)'
            )
          )[1]),
          ''
        ) is not null
        or nullif(
          trim((
            regexp_match(
              coalesce(
                nullif(btrim(s.last_landing_url), ''),
                nullif(btrim(s.landing_url), ''),
                ''
              ),
              '(?i)[?&]utm_medium=([^&]*)'
            )
          )[1]),
          ''
        ) is not null
        or nullif(
          trim((
            regexp_match(
              coalesce(
                nullif(btrim(s.last_landing_url), ''),
                nullif(btrim(s.landing_url), ''),
                ''
              ),
              '(?i)[?&]utm_campaign=([^&]*)'
            )
          )[1]),
          ''
        ) is not null
        or nullif(
          trim((
            regexp_match(
              coalesce(
                nullif(btrim(s.last_landing_url), ''),
                nullif(btrim(s.landing_url), ''),
                ''
              ),
              '(?i)[?&]utm_content=([^&]*)'
            )
          )[1]),
          ''
        ) is not null
        or nullif(
          trim((
            regexp_match(
              coalesce(
                nullif(btrim(s.last_landing_url), ''),
                nullif(btrim(s.landing_url), ''),
                ''
              ),
              '(?i)[?&]utm_term=([^&]*)'
            )
          )[1]),
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
    route,
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
  session_first_path as (
    select distinct on (pv.web_id, pv.session_id, day_bucket)
      pv.web_id,
      pv.session_id,
      (pv.started_at at time zone 'Asia/Jakarta')::date as day_bucket,
      left(btrim(pv.path), 2048) as route
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
    order by
      pv.web_id,
      pv.session_id,
      (pv.started_at at time zone 'Asia/Jakarta')::date,
      pv.started_at asc
  ),
  base as (
    select
      hs.web_id,
      hs.day,
      hs.session_id,
      coalesce(nullif(btrim(s.last_landing_url), ''), nullif(btrim(s.landing_url), '')) as landing_url,
      coalesce(nullif(btrim(s.last_utm_source), ''), nullif(btrim(s.utm_source), '')) as utm_source,
      coalesce(nullif(btrim(s.last_utm_medium), ''), nullif(btrim(s.utm_medium), '')) as utm_medium,
      coalesce(nullif(btrim(s.last_utm_campaign), ''), nullif(btrim(s.utm_campaign), '')) as utm_campaign,
      coalesce(nullif(btrim(s.last_utm_content), ''), nullif(btrim(s.utm_content), '')) as utm_content,
      coalesce(nullif(btrim(s.last_utm_term), ''), nullif(btrim(s.utm_term), '')) as utm_term,
      (coalesce(s.has_gclid, false) or coalesce(s.last_has_gclid, false)) as has_gclid,
      (coalesce(s.has_fbclid, false) or coalesce(s.last_has_fbclid, false)) as has_fbclid,
      (coalesce(s.has_msclkid, false) or coalesce(s.last_has_msclkid, false)) as has_msclkid,
      (coalesce(s.has_gbraid, false) or coalesce(s.last_has_gbraid, false)) as has_gbraid,
      (coalesce(s.has_wbraid, false) or coalesce(s.last_has_wbraid, false)) as has_wbraid,
      coalesce(nullif(btrim(s.last_referrer), ''), nullif(btrim(s.referrer), '')) as referrer
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
      c.web_id,
      c.day,
      coalesce(c.utm_source_eff, '') as utm_source,
      coalesce(c.utm_medium_eff, '') as utm_medium,
      coalesce(c.utm_campaign_eff, '') as utm_campaign,
      coalesce(c.utm_content_eff, '') as utm_content,
      coalesce(c.utm_term_eff, '') as utm_term,
      case
        when nullif(btrim(sp.route), '') is null then '/'
        else left(btrim(sp.route), 2048)
      end as route
    from classified c
    inner join session_first_path sp
      on sp.web_id = c.web_id
      and sp.session_id = c.session_id
      and sp.day_bucket = c.day
    where
      c.day between p_from and v_to
      and c.source_key in ('utm', 'paid_click_ids')
      and (
        nullif(btrim(c.utm_source_eff), '') is not null
        or nullif(btrim(c.utm_medium_eff), '') is not null
        or nullif(btrim(c.utm_campaign_eff), '') is not null
        or nullif(btrim(c.utm_content_eff), '') is not null
        or nullif(btrim(c.utm_term_eff), '') is not null
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
    route,
    count(*)::bigint as sessions_count
  from utm_rows
  group by web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term, route
  on conflict (web_id, day, utm_source, utm_medium, utm_campaign, utm_content, utm_term, route)
  do update set sessions_count = excluded.sessions_count;
end;
$body$;

revoke all on function public.refresh_analytics_daily_rollups(date, date, text) from public;
grant execute on function public.refresh_analytics_daily_rollups(date, date, text) to service_role;

comment on function public.refresh_analytics_daily_rollups(date, date, text) is
  'Rebuild analytics_daily_*; UTM rollup includes route = first human page_view path that day.';

-- ---------------------------------------------------------------------------
-- get_traffic_dashboard: expose route
-- ---------------------------------------------------------------------------

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
            uu.route,
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
  'CMS Traffic page: JSON with source_breakdown + utm_rows (incl. route) from analytics_daily_*. Requires cms_admins.';
