-- Hub: patch RPCs to use hub_require_active_web_id (requires 20260620101000)

create or replace function public.analytics_session_touch(
  p_session uuid,
  p_web_id text,
  p_referrer text,
  p_ua_hash text,
  p_auth uuid default null,
  p_landing_url text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null,
  p_meta_campaign_name text default null,
  p_meta_adset_name text default null,
  p_meta_ad_name text default null,
  p_has_gclid boolean default false,
  p_has_fbclid boolean default false,
  p_has_msclkid boolean default false,
  p_has_gbraid boolean default false,
  p_has_wbraid boolean default false,
  p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_visitor text;
  v_web text;
begin
  v_web := public.hub_require_active_web_id(p_web_id, false);

  v_visitor := left(coalesce(nullif(trim(p_visitor_id), ''), p_session::text), 64);

  insert into public.analytics_sessions (
    id, web_id, visitor_id, referrer, ua_hash, auth_user_id,
    landing_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    meta_campaign_name, meta_adset_name, meta_ad_name,
    has_gclid, has_fbclid, has_msclkid, has_gbraid, has_wbraid,

    first_landing_url, first_referrer,
    first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term,
    first_meta_campaign_name, first_meta_adset_name, first_meta_ad_name,
    first_has_gclid, first_has_fbclid, first_has_msclkid, first_has_gbraid, first_has_wbraid,

    last_landing_url, last_referrer,
    last_utm_source, last_utm_medium, last_utm_campaign, last_utm_content, last_utm_term,
    last_meta_campaign_name, last_meta_adset_name, last_meta_ad_name,
    last_has_gclid, last_has_fbclid, last_has_msclkid, last_has_gbraid, last_has_wbraid
  )
  values (
    p_session,
    v_web,
    v_visitor,
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_ua_hash), ''), 64),
    p_auth,
    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false),

    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false),

    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false)
  )
  on conflict (id) do update set
    last_seen_at = now(),
    web_id = excluded.web_id,
    visitor_id = excluded.visitor_id,
    referrer = coalesce(excluded.referrer, public.analytics_sessions.referrer),
    ua_hash = coalesce(excluded.ua_hash, public.analytics_sessions.ua_hash),
    auth_user_id = coalesce(excluded.auth_user_id, public.analytics_sessions.auth_user_id),

    landing_url = coalesce(
      nullif(btrim(public.analytics_sessions.landing_url), ''),
      nullif(btrim(excluded.landing_url), '')
    ),
    utm_source = coalesce(
      nullif(btrim(public.analytics_sessions.utm_source), ''),
      nullif(btrim(excluded.utm_source), '')
    ),
    utm_medium = coalesce(
      nullif(btrim(public.analytics_sessions.utm_medium), ''),
      nullif(btrim(excluded.utm_medium), '')
    ),
    utm_campaign = coalesce(
      nullif(btrim(public.analytics_sessions.utm_campaign), ''),
      nullif(btrim(excluded.utm_campaign), '')
    ),
    utm_content = coalesce(
      nullif(btrim(public.analytics_sessions.utm_content), ''),
      nullif(btrim(excluded.utm_content), '')
    ),
    utm_term = coalesce(
      nullif(btrim(public.analytics_sessions.utm_term), ''),
      nullif(btrim(excluded.utm_term), '')
    ),
    meta_campaign_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_campaign_name), ''),
      nullif(btrim(excluded.meta_campaign_name), '')
    ),
    meta_adset_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_adset_name), ''),
      nullif(btrim(excluded.meta_adset_name), '')
    ),
    meta_ad_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_ad_name), ''),
      nullif(btrim(excluded.meta_ad_name), '')
    ),
    has_gclid = public.analytics_sessions.has_gclid or excluded.has_gclid,
    has_fbclid = public.analytics_sessions.has_fbclid or excluded.has_fbclid,
    has_msclkid = public.analytics_sessions.has_msclkid or excluded.has_msclkid,
    has_gbraid = public.analytics_sessions.has_gbraid or excluded.has_gbraid,
    has_wbraid = public.analytics_sessions.has_wbraid or excluded.has_wbraid,

    first_landing_url = coalesce(
      nullif(btrim(public.analytics_sessions.first_landing_url), ''),
      nullif(btrim(excluded.first_landing_url), '')
    ),
    first_referrer = coalesce(
      nullif(btrim(public.analytics_sessions.first_referrer), ''),
      nullif(btrim(excluded.first_referrer), '')
    ),
    first_utm_source = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_source), ''),
      nullif(btrim(excluded.first_utm_source), '')
    ),
    first_utm_medium = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_medium), ''),
      nullif(btrim(excluded.first_utm_medium), '')
    ),
    first_utm_campaign = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_campaign), ''),
      nullif(btrim(excluded.first_utm_campaign), '')
    ),
    first_utm_content = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_content), ''),
      nullif(btrim(excluded.first_utm_content), '')
    ),
    first_utm_term = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_term), ''),
      nullif(btrim(excluded.first_utm_term), '')
    ),
    first_meta_campaign_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_campaign_name), ''),
      nullif(btrim(excluded.first_meta_campaign_name), '')
    ),
    first_meta_adset_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_adset_name), ''),
      nullif(btrim(excluded.first_meta_adset_name), '')
    ),
    first_meta_ad_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_ad_name), ''),
      nullif(btrim(excluded.first_meta_ad_name), '')
    ),
    first_has_gclid = public.analytics_sessions.first_has_gclid or excluded.first_has_gclid,
    first_has_fbclid = public.analytics_sessions.first_has_fbclid or excluded.first_has_fbclid,
    first_has_msclkid = public.analytics_sessions.first_has_msclkid or excluded.first_has_msclkid,
    first_has_gbraid = public.analytics_sessions.first_has_gbraid or excluded.first_has_gbraid,
    first_has_wbraid = public.analytics_sessions.first_has_wbraid or excluded.first_has_wbraid,

    last_landing_url = coalesce(nullif(btrim(excluded.last_landing_url), ''), public.analytics_sessions.last_landing_url),
    last_referrer = coalesce(nullif(btrim(excluded.last_referrer), ''), public.analytics_sessions.last_referrer),
    last_utm_source = coalesce(nullif(btrim(excluded.last_utm_source), ''), public.analytics_sessions.last_utm_source),
    last_utm_medium = coalesce(nullif(btrim(excluded.last_utm_medium), ''), public.analytics_sessions.last_utm_medium),
    last_utm_campaign = coalesce(nullif(btrim(excluded.last_utm_campaign), ''), public.analytics_sessions.last_utm_campaign),
    last_utm_content = coalesce(nullif(btrim(excluded.last_utm_content), ''), public.analytics_sessions.last_utm_content),
    last_utm_term = coalesce(nullif(btrim(excluded.last_utm_term), ''), public.analytics_sessions.last_utm_term),
    last_meta_campaign_name = coalesce(nullif(btrim(excluded.last_meta_campaign_name), ''), public.analytics_sessions.last_meta_campaign_name),
    last_meta_adset_name = coalesce(nullif(btrim(excluded.last_meta_adset_name), ''), public.analytics_sessions.last_meta_adset_name),
    last_meta_ad_name = coalesce(nullif(btrim(excluded.last_meta_ad_name), ''), public.analytics_sessions.last_meta_ad_name),
    last_has_gclid = public.analytics_sessions.last_has_gclid or excluded.last_has_gclid,
    last_has_fbclid = public.analytics_sessions.last_has_fbclid or excluded.last_has_fbclid,
    last_has_msclkid = public.analytics_sessions.last_has_msclkid or excluded.last_has_msclkid,
    last_has_gbraid = public.analytics_sessions.last_has_gbraid or excluded.last_has_gbraid,
    last_has_wbraid = public.analytics_sessions.last_has_wbraid or excluded.last_has_wbraid;
end;
$body$;

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
  v_web text;
begin
  v_to := coalesce(p_to, p_from);
  if p_from > v_to then
    raise exception 'invalid date range' using errcode = '22023';
  end if;

  v_web := public.hub_require_active_web_id(p_web_id, true);

  delete from public.analytics_daily_source_breakdown d
  where d.day between p_from and v_to
    and (v_web is null or d.web_id = v_web);

  delete from public.analytics_daily_utm u
  where u.day between p_from and v_to
    and (v_web is null or u.web_id = v_web);

  insert into public.analytics_daily_source_breakdown (web_id, day, source_key, sessions_count)
  with human_sessions as (
    select distinct
      pv.web_id,
      pv.session_id,
      (pv.started_at at time zone 'Asia/Jakarta')::date as day
    from public.analytics_page_views pv
    where
      (v_web is null or pv.web_id = v_web)
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
      (v_web is null or pv.web_id = v_web)
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
      (v_web is null or pv.web_id = v_web)
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

  w := public.hub_require_active_web_id(p_web_id, true);

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

create or replace function public.admin_analytics_summary(p_from timestamptz, p_to timestamptz, p_web_id text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_web_id text;
  v_daily jsonb;
  v_top_paths jsonb;
  v_top_keys jsonb;
  v_top_blog jsonb;
  v_duration jsonb;
  v_heatmap jsonb;
  v_service jsonb;
  v_acquisition_channels jsonb;
  v_acquisition_top_campaigns jsonb;
  v_acquisition_top_meta_ads jsonb;
  v_totals_part jsonb;
  v_summary jsonb;
begin
  if not exists (select 1 from public.cms_admins c where c.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  v_web_id := public.hub_require_active_web_id(p_web_id, false);

  if p_to < p_from then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  -- Keep the same "human view" heuristic already applied in 20260605171900_filter_human_visitors.sql

  select coalesce(
    jsonb_agg(to_jsonb(d) order by d.day),
    '[]'::jsonb
  )
  into v_daily
  from (
    select
      x.day,
      coalesce(i.impressions, 0)::bigint as impressions,
      coalesce(c.clicks, 0)::bigint as clicks
    from (
      select distinct date_trunc('day', started_at at time zone 'Asia/Jakarta') as day
      from public.analytics_page_views
      where web_id = v_web_id and started_at >= p_from and started_at < p_to
        and (
          coalesce(active_ms, 0) > 0
          or coalesce(scroll_max_pct, 0) >= 5
          or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
        )
      union
      select distinct date_trunc('day', created_at at time zone 'Asia/Jakarta') as day
      from public.analytics_click_events
      where web_id = v_web_id and created_at >= p_from and created_at < p_to
    ) x
    left join (
      select
        date_trunc('day', started_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as impressions
      from public.analytics_page_views
      where web_id = v_web_id and started_at >= p_from and started_at < p_to
        and (
          coalesce(active_ms, 0) > 0
          or coalesce(scroll_max_pct, 0) >= 5
          or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
        )
      group by 1
    ) i on i.day = x.day
    left join (
      select
        date_trunc('day', created_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as clicks
      from public.analytics_click_events
      where web_id = v_web_id and created_at >= p_from and created_at < p_to
      group by 1
    ) c on c.day = x.day
  ) d;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.impressions desc), '[]'::jsonb)
  into v_top_paths
  from (
    with ranked as (
      select path, count(*)::bigint as impressions
      from public.analytics_page_views
      where web_id = v_web_id and started_at >= p_from and started_at < p_to
        and (
          coalesce(active_ms, 0) > 0
          or coalesce(scroll_max_pct, 0) >= 5
          or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
        )
      group by path
      order by count(*) desc
      limit 10
    )
    select
      r.path,
      r.impressions,
      coalesce(s.unique_sessions, 0)::bigint as unique_sessions,
      coalesce(c.path_clicks, 0)::bigint as path_clicks,
      coalesce(d.duration_n, 0)::bigint as duration_n,
      d.median_active_ms,
      d.avg_active_ms
    from ranked r
    left join (
      select path, count(distinct session_id)::bigint as unique_sessions
      from public.analytics_page_views
      where web_id = v_web_id and started_at >= p_from and started_at < p_to
        and (
          coalesce(active_ms, 0) > 0
          or coalesce(scroll_max_pct, 0) >= 5
          or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
        )
      group by path
    ) s on s.path = r.path
    left join (
      select path, count(*)::bigint as path_clicks
      from public.analytics_click_events
      where web_id = v_web_id and created_at >= p_from and created_at < p_to
      group by path
    ) c on c.path = r.path
    left join (
      select
        path,
        count(*)::bigint as duration_n,
        (percentile_disc(0.5) within group (order by active_ms))::bigint as median_active_ms,
        round(avg(active_ms))::bigint as avg_active_ms
      from public.analytics_page_views
      where web_id = v_web_id and started_at >= p_from and started_at < p_to
        and (ended_at is not null or active_ms > 0)
        and (
          coalesce(active_ms, 0) > 0
          or coalesce(scroll_max_pct, 0) >= 5
          or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
        )
      group by path
    ) d on d.path = r.path
  ) t;

  select coalesce(jsonb_agg(to_jsonb(k)), '[]'::jsonb)
  into v_top_keys
  from (
    with
      impressions_total as (
        select count(*)::bigint as n
        from public.analytics_page_views
        where web_id = v_web_id and started_at >= p_from and started_at < p_to
          and (
            coalesce(active_ms, 0) > 0
            or coalesce(scroll_max_pct, 0) >= 5
            or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
          )
      ),
      key_counts as (
        select
          track_key,
          count(*)::bigint as clicks
        from public.analytics_click_events
        where web_id = v_web_id and created_at >= p_from and created_at < p_to
          and track_key is not null
        group by track_key
        order by count(*) desc
        limit 5
      )
    select
      kc.track_key,
      kc.clicks,
      case
        when it.n > 0 then round((kc.clicks::numeric / it.n::numeric), 6)
        else 0::numeric
      end as ctr
    from key_counts kc
    cross join impressions_total it
  ) k;

  select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
  into v_top_blog
  from (
    select
      pv.path,
      coalesce(p.title, pv.path) as title,
      count(*)::bigint as impressions,
      round(avg(pv.active_ms))::bigint as avg_active_ms
    from public.analytics_page_views pv
    left join public.posts p on p.slug = substring(pv.path from '^/blog/(.+)$')
    where pv.web_id = v_web_id and pv.started_at >= p_from and pv.started_at < p_to
      and pv.path ~ '^/blog/.+'
      and pv.path <> '/blog'
      and (
        coalesce(pv.active_ms, 0) > 0
        or coalesce(pv.scroll_max_pct, 0) >= 5
        or (pv.ended_at is not null and extract(epoch from (pv.ended_at - pv.started_at)) >= 5)
      )
    group by pv.path, p.title
    order by impressions desc
    limit 5
  ) b;

  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
  into v_duration
  from (
    select path, round(avg(active_ms))::bigint as avg_ms
    from public.analytics_page_views
    where web_id = v_web_id and started_at >= p_from and started_at < p_to
      and (ended_at is not null or active_ms > 0)
      and (
        coalesce(active_ms, 0) > 0
        or coalesce(scroll_max_pct, 0) >= 5
        or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
      )
    group by path
    order by avg_ms desc
    limit 30
  ) u;

  select coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb)
  into v_heatmap
  from (
    select
      case
        when path = '/' then 'home'
        when path = '/service' then 'service'
        when path = '/blog' then 'blog_index'
        when path ~ '^/blog/.+' then 'blog_post'
        else 'other'
      end as route_bucket,
      extract(hour from (started_at at time zone 'Asia/Jakarta'))::int as hour_of_day,
      round(avg(active_ms))::bigint as avg_ms
    from public.analytics_page_views
    where web_id = v_web_id and started_at >= p_from and started_at < p_to
      and (
        coalesce(active_ms, 0) > 0
        or coalesce(scroll_max_pct, 0) >= 5
        or (ended_at is not null and extract(epoch from (ended_at - started_at)) >= 5)
      )
    group by 1, 2
    order by 1, 2
  ) h;

  select jsonb_build_object(
    'impressions',
    (select count(*)::bigint from public.analytics_page_views pv2
      where pv2.web_id = v_web_id and pv2.started_at >= p_from and pv2.started_at < p_to and pv2.path = '/service'
        and (
          coalesce(pv2.active_ms, 0) > 0
          or coalesce(pv2.scroll_max_pct, 0) >= 5
          or (pv2.ended_at is not null and extract(epoch from (pv2.ended_at - pv2.started_at)) >= 5)
        )),
    'contact_clicks_on_service',
    (select count(*)::bigint from public.analytics_click_events ce2
      where ce2.web_id = v_web_id and ce2.created_at >= p_from and ce2.created_at < p_to
        and ce2.path = '/service'
        and ce2.track_key = 'contact_cta'),
    'conversion',
    case
      when (select count(*) from public.analytics_page_views pv3
            where pv3.web_id = v_web_id and pv3.started_at >= p_from and pv3.started_at < p_to and pv3.path = '/service'
              and (
                coalesce(pv3.active_ms, 0) > 0
                or coalesce(pv3.scroll_max_pct, 0) >= 5
                or (pv3.ended_at is not null and extract(epoch from (pv3.ended_at - pv3.started_at)) >= 5)
              )) > 0
      then round(
        (select count(*)::numeric from public.analytics_click_events ce3
          where ce3.web_id = v_web_id and ce3.created_at >= p_from and ce3.created_at < p_to
            and ce3.path = '/service'
            and ce3.track_key = 'contact_cta')
        / (select count(*)::numeric from public.analytics_page_views pv4
            where pv4.web_id = v_web_id and pv4.started_at >= p_from and pv4.started_at < p_to and pv4.path = '/service'
              and (
                coalesce(pv4.active_ms, 0) > 0
                or coalesce(pv4.scroll_max_pct, 0) >= 5
                or (pv4.ended_at is not null and extract(epoch from (pv4.ended_at - pv4.started_at)) >= 5)
              )),
        6
      )
      else 0::numeric
    end
  ) into v_service;

  -- Sessions with activity in range → one channel per session (heuristic; not GA4-equivalent).
  select coalesce(jsonb_agg(to_jsonb(a) order by a.sessions desc), '[]'::jsonb)
  into v_acquisition_channels
  from (
    select channel, count(*)::bigint as sessions
    from (
      select
        sc.id,
        case
          when sc.has_gclid or sc.has_gbraid or sc.has_wbraid then 'Paid search'
          when sc.has_msclkid then 'Paid search'
          when sc.has_fbclid then 'Paid social'
          when lower(coalesce(sc.utm_medium, '')) ~ '(cpc|ppc|paidsearch|paid|cpm|cad|display|banner)'
            and lower(coalesce(sc.utm_medium, '')) !~ 'social' then 'Paid (UTM)'
          when lower(coalesce(sc.utm_medium, '')) ~ '(cpc|ppc|paidsearch|paid|cpm|cad|display|banner)'
            and lower(coalesce(sc.utm_medium, '')) ~ 'social' then 'Paid social'
          when lower(coalesce(sc.utm_medium, '')) = 'email'
            or lower(coalesce(sc.utm_source, '')) ~ '(email|newsletter|e-mail)' then 'Email'
          when nullif(btrim(sc.utm_source), '') is not null
            or nullif(btrim(sc.utm_medium), '') is not null then
            case
              when lower(coalesce(sc.utm_medium, '')) ~ 'social' then 'Social (UTM)'
              else 'Campaign (UTM)'
            end
          when lower(coalesce(sc.landing_url, '')) like '%utm_%' then 'Campaign (UTM)'
          else
            case
              when nullif(btrim(sc.referrer), '') is null then 'Direct'
              when sc.ref_host is null or sc.ref_host = '' then 'Referral'
              when sc.ref_host ~ '(^|\.)google\.' and sc.ref_host !~* 'googleusercontent' then 'Organic search'
              when sc.ref_host ~ '(^|\.)(bing\.|yahoo\.|duckduckgo\.|yandex\.|baidu\.|ecosia\.)' then 'Organic search'
              when sc.ref_host ~ '(facebook|fb\.|instagram|linkedin|twitter|t\.co|tiktok|youtube|pinterest|threads\.|snap\.)' then 'Social'
              else 'Referral'
            end
        end as channel
      from (
        select
          s.id,
          s.referrer,
          s.landing_url,
          s.utm_source,
          s.utm_medium,
          s.has_gclid,
          s.has_gbraid,
          s.has_wbraid,
          s.has_msclkid,
          s.has_fbclid,
          lower((regexp_match(nullif(trim(s.referrer), ''), '^https?://([^/[:space:]]+)', 'i'))[1]) as ref_host
        from (
          select distinct pv.session_id
          from public.analytics_page_views pv
          where pv.web_id = v_web_id and pv.started_at >= p_from and pv.started_at < p_to
            and (
              coalesce(pv.active_ms, 0) > 0
              or coalesce(pv.scroll_max_pct, 0) >= 5
              or (pv.ended_at is not null and extract(epoch from (pv.ended_at - pv.started_at)) >= 5)
            )
        ) act
        inner join public.analytics_sessions s
          on s.id = act.session_id and s.web_id = v_web_id
      ) sc
    ) ch
    group by channel
  ) a;

  -- The rest of admin_analytics_summary stays identical to the human-filtered version.
  -- Reuse campaign/meta breakdowns and totals from 20260605171900.

  select coalesce(jsonb_agg(to_jsonb(c) order by c.sessions desc), '[]'::jsonb)
  into v_acquisition_top_campaigns
  from (
    select
      coalesce(nullif(btrim(s.utm_source), ''), '') as utm_source,
      coalesce(nullif(btrim(s.utm_medium), ''), '') as utm_medium,
      coalesce(nullif(btrim(s.utm_campaign), ''), '') as utm_campaign,
      coalesce(nullif(btrim(s.utm_content), ''), '') as utm_content,
      coalesce(nullif(btrim(s.utm_term), ''), '') as utm_term,
      coalesce(max(nullif(btrim(s.meta_campaign_name), '')), '') as meta_campaign_name,
      coalesce(max(nullif(btrim(s.meta_adset_name), '')), '') as meta_adset_name,
      coalesce(max(nullif(btrim(s.meta_ad_name), '')), '') as meta_ad_name,
      count(distinct s.id)::bigint as sessions
    from (
      select distinct pv.session_id
      from public.analytics_page_views pv
      where pv.web_id = v_web_id and pv.started_at >= p_from and pv.started_at < p_to
        and (
          coalesce(pv.active_ms, 0) > 0
          or coalesce(pv.scroll_max_pct, 0) >= 5
          or (pv.ended_at is not null and extract(epoch from (pv.ended_at - pv.started_at)) >= 5)
        )
    ) act
    inner join public.analytics_sessions s on s.id = act.session_id and s.web_id = v_web_id
    where nullif(btrim(s.utm_campaign), '') is not null
    group by 1, 2, 3, 4, 5
    order by sessions desc
    limit 20
  ) c;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.sessions desc), '[]'::jsonb)
  into v_acquisition_top_meta_ads
  from (
    select
      coalesce(nullif(btrim(s.meta_campaign_name), ''), '') as meta_campaign_name,
      coalesce(nullif(btrim(s.meta_adset_name), ''), '') as meta_adset_name,
      coalesce(nullif(btrim(s.meta_ad_name), ''), '') as meta_ad_name,
      count(distinct s.id)::bigint as sessions
    from (
      select distinct pv.session_id
      from public.analytics_page_views pv
      where pv.web_id = v_web_id and pv.started_at >= p_from and pv.started_at < p_to
        and (
          coalesce(pv.active_ms, 0) > 0
          or coalesce(pv.scroll_max_pct, 0) >= 5
          or (pv.ended_at is not null and extract(epoch from (pv.ended_at - pv.started_at)) >= 5)
        )
    ) act
    inner join public.analytics_sessions s on s.id = act.session_id and s.web_id = v_web_id
    where
      nullif(btrim(s.meta_campaign_name), '') is not null
      or nullif(btrim(s.meta_adset_name), '') is not null
      or nullif(btrim(s.meta_ad_name), '') is not null
    group by 1, 2, 3
    order by sessions desc
    limit 20
  ) m;

  v_totals_part := jsonb_build_object(
    'impressions',
    (select count(*)::bigint
     from public.analytics_page_views pv_tot
     where pv_tot.web_id = v_web_id and pv_tot.started_at >= p_from and pv_tot.started_at < p_to
       and (
         coalesce(pv_tot.active_ms, 0) > 0
         or coalesce(pv_tot.scroll_max_pct, 0) >= 5
         or (pv_tot.ended_at is not null and extract(epoch from (pv_tot.ended_at - pv_tot.started_at)) >= 5)
       )),
    'clicks',
    (select count(*)::bigint
     from public.analytics_click_events ce_tot
     where ce_tot.web_id = v_web_id and ce_tot.created_at >= p_from and ce_tot.created_at < p_to),
    'unique_sessions',
    (select count(distinct pv_tot2.session_id)::bigint
     from public.analytics_page_views pv_tot2
     where pv_tot2.web_id = v_web_id and pv_tot2.started_at >= p_from and pv_tot2.started_at < p_to
       and (
         coalesce(pv_tot2.active_ms, 0) > 0
         or coalesce(pv_tot2.scroll_max_pct, 0) >= 5
         or (pv_tot2.ended_at is not null and extract(epoch from (pv_tot2.ended_at - pv_tot2.started_at)) >= 5)
       ))
  );

  execute $summ$
    select jsonb_build_object(
      'totals', $1::jsonb,
      'daily', $2::jsonb,
      'top_paths', $3::jsonb,
      'top_track_keys', $4::jsonb,
      'top_blog', $5::jsonb,
      'duration_by_path', $6::jsonb,
      'heatmap', $7::jsonb,
      'service', $8::jsonb,
      'acquisition_channels', $9::jsonb,
      'acquisition_top_campaigns', $10::jsonb,
      'acquisition_top_meta_ads', $11::jsonb
    )
  $summ$
  into v_summary
  using
    v_totals_part,
    v_daily,
    v_top_paths,
    v_top_keys,
    v_top_blog,
    v_duration,
    v_heatmap,
    v_service,
    v_acquisition_channels,
    v_acquisition_top_campaigns,
    v_acquisition_top_meta_ads;

  return v_summary;
end;
$$;