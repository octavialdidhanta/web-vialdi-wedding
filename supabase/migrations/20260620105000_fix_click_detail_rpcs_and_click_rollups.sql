-- 1) Detail klik: jangan bergantung pada analytics_daily_sessions (rollup kosong).
-- 2) Isi ulang analytics_daily_* click rollups dari analytics_click_events.

-- ---------------------------------------------------------------------------
-- get_click_targets_for_source_key (sumber: UTM, Direct, …)
-- ---------------------------------------------------------------------------
create or replace function public.get_click_targets_for_source_key(
  p_web_id text,
  p_from date,
  p_to date,
  p_source_key text,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_from date;
  v_to date;
  v_web text;
  v_key text;
begin
  if p_web_id is null or btrim(p_web_id) = '' then
    raise exception 'web_id is required';
  end if;

  v_web := public.hub_require_active_web_id(p_web_id, false);

  if not public.can_access_web_id(v_web) then
    raise exception 'forbidden';
  end if;

  v_from := p_from;
  v_to := p_to;
  if v_from is null or v_to is null then
    raise exception 'invalid range';
  end if;
  if v_to < v_from then
    raise exception 'invalid range';
  end if;

  v_key := coalesce(nullif(btrim(p_source_key), ''), '');
  if v_key not in ('utm', 'paid_click_ids', 'referral', 'direct') then
    raise exception 'invalid source_key';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'clicks', clicks,
      'unique_sessions', unique_sessions,
      'track_key', nullif(track_key, ''),
      'element_type', element_type,
      'element_label', element_label,
      'target_url', nullif(target_url, ''),
      'is_internal', is_internal
    ) order by clicks desc), '[]'::jsonb)
    from (
      select
        count(*)::bigint as clicks,
        count(distinct ce.session_id)::bigint as unique_sessions,
        coalesce(ce.track_key, '') as track_key,
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, '') as target_url,
        coalesce(ce.is_internal, false) as is_internal
      from public.analytics_click_events ce
      left join public.analytics_sessions s
        on s.id = ce.session_id and s.web_id = ce.web_id
      cross join lateral (
        select
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
      ) bx
      cross join lateral (
        select
          coalesce(
            nullif(btrim(bx.utm_source), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_source=([^&]*)'))[1]), '')
          ) as utm_source_eff,
          coalesce(
            nullif(btrim(bx.utm_medium), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_medium=([^&]*)'))[1]), '')
          ) as utm_medium_eff,
          coalesce(
            nullif(btrim(bx.utm_campaign), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_campaign=([^&]*)'))[1]), '')
          ) as utm_campaign_eff,
          coalesce(
            nullif(btrim(bx.utm_content), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_content=([^&]*)'))[1]), '')
          ) as utm_content_eff,
          coalesce(
            nullif(btrim(bx.utm_term), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_term=([^&]*)'))[1]), '')
          ) as utm_term_eff,
          bx.has_gclid,
          bx.has_fbclid,
          bx.has_msclkid,
          bx.has_gbraid,
          bx.has_wbraid,
          bx.referrer
      ) eff
      cross join lateral (
        select
          case
            when eff.has_gclid or eff.has_fbclid or eff.has_msclkid or eff.has_gbraid or eff.has_wbraid then 'paid_click_ids'
            when
              nullif(btrim(eff.utm_source_eff), '') is not null
              or nullif(btrim(eff.utm_medium_eff), '') is not null
              or nullif(btrim(eff.utm_campaign_eff), '') is not null
              or nullif(btrim(eff.utm_content_eff), '') is not null
              or nullif(btrim(eff.utm_term_eff), '') is not null
              then 'utm'
            when nullif(btrim(eff.referrer), '') is not null then 'referral'
            else 'direct'
          end as source_key
      ) sk
      where ce.web_id = v_web
        and (timezone('Asia/Jakarta', ce.created_at))::date between v_from and v_to
        and sk.source_key = v_key
      group by
        coalesce(ce.track_key, ''),
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, ''),
        coalesce(ce.is_internal, false)
      order by count(*) desc
      limit greatest(1, least(p_limit, 200))
    ) t
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- get_click_targets_for_utm_row (baris UTM tracking)
-- ---------------------------------------------------------------------------
create or replace function public.get_click_targets_for_utm_row(
  p_web_id text,
  p_from date,
  p_to date,
  p_route text,
  p_utm_campaign text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_content text,
  p_utm_term text,
  p_session_id text default null,
  p_session_day date default null,
  p_limit integer default 50,
  p_visitor_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_from date;
  v_to date;
  v_web text;
  v_route text;
  v_campaign text;
  v_source text;
  v_medium text;
  v_content text;
  v_term text;
  v_session_id text;
  v_visitor_id text;
begin
  if p_web_id is null or btrim(p_web_id) = '' then
    raise exception 'web_id is required';
  end if;

  v_web := public.hub_require_active_web_id(p_web_id, false);

  if not public.can_access_web_id(v_web) then
    raise exception 'forbidden';
  end if;

  v_from := p_from;
  v_to := p_to;
  if v_from is null or v_to is null or v_to < v_from then
    raise exception 'invalid range';
  end if;

  v_route := coalesce(p_route, '');
  v_campaign := coalesce(p_utm_campaign, '');
  v_source := coalesce(p_utm_source, '');
  v_medium := coalesce(p_utm_medium, '');
  v_content := coalesce(p_utm_content, '');
  v_term := coalesce(p_utm_term, '');
  v_session_id := coalesce(nullif(btrim(p_session_id), ''), '');
  v_visitor_id := coalesce(nullif(btrim(p_visitor_id), ''), '');

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'clicks', clicks,
      'unique_sessions', unique_sessions,
      'track_key', nullif(track_key, ''),
      'element_type', element_type,
      'element_label', element_label,
      'target_url', nullif(target_url, ''),
      'is_internal', is_internal
    ) order by clicks desc), '[]'::jsonb)
    from (
      select
        count(*)::bigint as clicks,
        count(distinct ce.session_id)::bigint as unique_sessions,
        coalesce(ce.track_key, '') as track_key,
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, '') as target_url,
        coalesce(ce.is_internal, false) as is_internal
      from public.analytics_click_events ce
      left join public.analytics_sessions s
        on s.id = ce.session_id and s.web_id = ce.web_id
      cross join lateral (
        select
          coalesce(nullif(btrim(ce.visitor_id), ''), nullif(btrim(s.visitor_id), '')) as visitor_id,
          coalesce(nullif(btrim(s.last_landing_url), ''), nullif(btrim(s.landing_url), '')) as landing_url,
          coalesce(nullif(btrim(s.last_utm_source), ''), nullif(btrim(s.utm_source), '')) as utm_source,
          coalesce(nullif(btrim(s.last_utm_medium), ''), nullif(btrim(s.utm_medium), '')) as utm_medium,
          coalesce(nullif(btrim(s.last_utm_campaign), ''), nullif(btrim(s.utm_campaign), '')) as utm_campaign,
          coalesce(nullif(btrim(s.last_utm_content), ''), nullif(btrim(s.utm_content), '')) as utm_content,
          coalesce(nullif(btrim(s.last_utm_term), ''), nullif(btrim(s.utm_term), '')) as utm_term
      ) bx
      cross join lateral (
        select
          coalesce(
            nullif(btrim(bx.utm_source), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_source=([^&]*)'))[1]), '')
          ) as utm_source_eff,
          coalesce(
            nullif(btrim(bx.utm_medium), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_medium=([^&]*)'))[1]), '')
          ) as utm_medium_eff,
          coalesce(
            nullif(btrim(bx.utm_campaign), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_campaign=([^&]*)'))[1]), '')
          ) as utm_campaign_eff,
          coalesce(
            nullif(btrim(bx.utm_content), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_content=([^&]*)'))[1]), '')
          ) as utm_content_eff,
          coalesce(
            nullif(btrim(bx.utm_term), ''),
            nullif(trim((regexp_match(coalesce(bx.landing_url, ''), '(?i)[?&]utm_term=([^&]*)'))[1]), '')
          ) as utm_term_eff
      ) eff
      cross join lateral (
        select
          coalesce(
            trim(both '/' from regexp_replace(
              regexp_replace(coalesce(bx.landing_url, ''), '^https?://[^/]+', '', 'i'),
              '[?#].*$',
              ''
            )),
            ''
          ) as route_path,
          nullif(btrim(bx.landing_url), '') is not null as had_landing_ref
      ) lp
      where ce.web_id = v_web
        and (timezone('Asia/Jakarta', ce.created_at))::date between v_from and v_to
        and (p_session_day is null or (timezone('Asia/Jakarta', ce.created_at))::date = p_session_day)
        and (
          (v_visitor_id <> '' and bx.visitor_id = v_visitor_id)
          or (v_visitor_id = '' and v_session_id <> '' and ce.session_id::text = v_session_id)
          or (
            v_visitor_id = ''
            and v_session_id = ''
            and coalesce(
              left(
                case
                  when lp.route_path = '' and lp.had_landing_ref then '/'
                  when lp.route_path = '' then ''
                  when left(lp.route_path, 1) = '/' then lp.route_path
                  else '/' || lp.route_path
                end,
                512
              ),
              ''
            ) = v_route
            and coalesce(nullif(btrim(eff.utm_campaign_eff), ''), '') = v_campaign
            and coalesce(nullif(btrim(eff.utm_source_eff), ''), '') = v_source
            and coalesce(nullif(btrim(eff.utm_medium_eff), ''), '') = v_medium
            and coalesce(nullif(btrim(eff.utm_content_eff), ''), '') = v_content
            and coalesce(nullif(btrim(eff.utm_term_eff), ''), '') = v_term
          )
        )
      group by
        coalesce(ce.track_key, ''),
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, ''),
        coalesce(ce.is_internal, false)
      order by count(*) desc
      limit greatest(1, least(p_limit, 200))
    ) t
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Rollup klik harian (dipanggil setelah refresh_analytics_daily_rollups hub)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_analytics_daily_click_rollups(
  p_from date,
  p_to date default null,
  p_web_id text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_to date;
  v_web text;
begin
  v_to := coalesce(p_to, p_from);
  if p_from > v_to then
    raise exception 'invalid date range' using errcode = '22023';
  end if;

  v_web := public.hub_require_active_web_id(p_web_id, true);

  delete from public.analytics_daily_clicks d
  where d.day between p_from and v_to
    and (v_web is null or d.web_id = v_web);

  delete from public.analytics_daily_top_click_targets t
  where t.day between p_from and v_to
    and (v_web is null or t.web_id = v_web);

  delete from public.analytics_daily_top_clicks t
  where t.day between p_from and v_to
    and (v_web is null or t.web_id = v_web);

  delete from public.analytics_daily_sessions s
  where s.day between p_from and v_to
    and (v_web is null or s.web_id = v_web);

  insert into public.analytics_daily_clicks (web_id, day, clicks_count, unique_sessions_count)
  select
    ce.web_id,
    (timezone('Asia/Jakarta', ce.created_at))::date as day,
    count(*)::bigint,
    count(distinct ce.session_id)::bigint
  from public.analytics_click_events ce
  where (v_web is null or ce.web_id = v_web)
    and (timezone('Asia/Jakarta', ce.created_at))::date between p_from and v_to
  group by ce.web_id, (timezone('Asia/Jakarta', ce.created_at))::date;

  insert into public.analytics_daily_top_click_targets (
    web_id,
    day,
    path,
    track_key,
    element_type,
    element_label,
    target_url,
    is_internal,
    clicks_count,
    unique_sessions_count
  )
  select
    ce.web_id,
    (timezone('Asia/Jakarta', ce.created_at))::date as day,
    left(btrim(ce.path), 2048),
    coalesce(ce.track_key, ''),
    ce.element_type,
    ce.element_label,
    coalesce(ce.target_url, ''),
    coalesce(ce.is_internal, false),
    count(*)::bigint,
    count(distinct ce.session_id)::bigint
  from public.analytics_click_events ce
  where (v_web is null or ce.web_id = v_web)
    and (timezone('Asia/Jakarta', ce.created_at))::date between p_from and v_to
  group by
    ce.web_id,
    (timezone('Asia/Jakarta', ce.created_at))::date,
    left(btrim(ce.path), 2048),
    coalesce(ce.track_key, ''),
    ce.element_type,
    ce.element_label,
    coalesce(ce.target_url, ''),
    coalesce(ce.is_internal, false);

  insert into public.analytics_daily_top_clicks (
    web_id,
    day,
    path,
    track_key,
    element_type,
    element_label,
    clicks_count,
    unique_sessions_count
  )
  select
    ce.web_id,
    (timezone('Asia/Jakarta', ce.created_at))::date as day,
    left(btrim(ce.path), 2048),
    coalesce(ce.track_key, ''),
    ce.element_type,
    ce.element_label,
    count(*)::bigint,
    count(distinct ce.session_id)::bigint
  from public.analytics_click_events ce
  where (v_web is null or ce.web_id = v_web)
    and (timezone('Asia/Jakarta', ce.created_at))::date between p_from and v_to
  group by
    ce.web_id,
    (timezone('Asia/Jakarta', ce.created_at))::date,
    left(btrim(ce.path), 2048),
    coalesce(ce.track_key, ''),
    ce.element_type,
    ce.element_label;

  insert into public.analytics_daily_sessions (
    web_id,
    day,
    sessions_count,
    sessions_with_utm_count,
    sessions_with_gclid_count,
    sessions_with_fbclid_count,
    sessions_with_msclkid_count
  )
  select
    s.web_id,
    (timezone('Asia/Jakarta', s.started_at))::date as day,
    count(distinct s.id)::bigint,
    count(distinct s.id) filter (
      where
        nullif(btrim(s.utm_source), '') is not null
        or nullif(btrim(s.utm_medium), '') is not null
        or nullif(btrim(s.utm_campaign), '') is not null
    )::bigint,
    count(distinct s.id) filter (where coalesce(s.has_gclid, false))::bigint,
    count(distinct s.id) filter (where coalesce(s.has_fbclid, false))::bigint,
    count(distinct s.id) filter (where coalesce(s.has_msclkid, false))::bigint
  from public.analytics_sessions s
  where (v_web is null or s.web_id = v_web)
    and (timezone('Asia/Jakarta', s.started_at))::date between p_from and v_to
  group by s.web_id, (timezone('Asia/Jakarta', s.started_at))::date;
end;
$function$;

revoke all on function public.refresh_analytics_daily_click_rollups(date, date, text) from public;
grant execute on function public.refresh_analytics_daily_click_rollups(date, date, text) to service_role;
