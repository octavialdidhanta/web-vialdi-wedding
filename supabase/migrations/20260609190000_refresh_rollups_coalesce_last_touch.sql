-- Rollups: classify sessions using coalesce(last_*, legacy columns) on analytics_sessions.
-- Fixes cases where first-touch columns kept a path without query but last-touch captured UTM
-- (e.g. SPA / in-app browser), and aligns with analytics_session_touch last-touch updates.

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
  'Rebuild analytics_daily_*; prefers last-touch UTM/landing when first-touch columns are empty or stripped.';
