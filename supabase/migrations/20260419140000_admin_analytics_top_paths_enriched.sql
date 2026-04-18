-- Enrich top_paths: unique_sessions, path_clicks, median/avg active_ms + duration_n (same duration filter as duration_by_path).

create or replace function public.admin_analytics_summary(p_from timestamptz, p_to timestamptz, p_web_id text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_totals_impressions bigint;
  v_totals_clicks bigint;
  v_totals_sessions bigint;
  v_daily jsonb;
  v_top_paths jsonb;
  v_top_keys jsonb;
  v_top_blog jsonb;
  v_duration jsonb;
  v_heatmap jsonb;
  v_service jsonb;
begin
  if not exists (select 1 from public.cms_admins c where c.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  if p_to < p_from then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  select count(*)::bigint into v_totals_impressions
  from public.analytics_page_views pv
  where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to;

  select count(*)::bigint into v_totals_clicks
  from public.analytics_click_events ce
  where ce.web_id = p_web_id and ce.created_at >= p_from and ce.created_at < p_to;

  select count(distinct pv.session_id)::bigint into v_totals_sessions
  from public.analytics_page_views pv
  where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to;

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
      where web_id = p_web_id and started_at >= p_from and started_at < p_to
      union
      select distinct date_trunc('day', created_at at time zone 'Asia/Jakarta') as day
      from public.analytics_click_events
      where web_id = p_web_id and created_at >= p_from and created_at < p_to
    ) x
    left join (
      select
        date_trunc('day', started_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as impressions
      from public.analytics_page_views
      where web_id = p_web_id and started_at >= p_from and started_at < p_to
      group by 1
    ) i on i.day = x.day
    left join (
      select
        date_trunc('day', created_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as clicks
      from public.analytics_click_events
      where web_id = p_web_id and created_at >= p_from and created_at < p_to
      group by 1
    ) c on c.day = x.day
  ) d;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.impressions desc), '[]'::jsonb)
  into v_top_paths
  from (
    with ranked as (
      select path, count(*)::bigint as impressions
      from public.analytics_page_views
      where web_id = p_web_id and started_at >= p_from and started_at < p_to
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
      where web_id = p_web_id and started_at >= p_from and started_at < p_to
      group by path
    ) s on s.path = r.path
    left join (
      select path, count(*)::bigint as path_clicks
      from public.analytics_click_events
      where web_id = p_web_id and created_at >= p_from and created_at < p_to
      group by path
    ) c on c.path = r.path
    left join (
      select
        path,
        count(*)::bigint as duration_n,
        (percentile_disc(0.5) within group (order by active_ms))::bigint as median_active_ms,
        round(avg(active_ms))::bigint as avg_active_ms
      from public.analytics_page_views
      where web_id = p_web_id and started_at >= p_from and started_at < p_to
        and (ended_at is not null or active_ms > 0)
      group by path
    ) d on d.path = r.path
  ) t;

  select coalesce(jsonb_agg(to_jsonb(k)), '[]'::jsonb)
  into v_top_keys
  from (
    select
      track_key,
      count(*)::bigint as clicks,
      case
        when v_totals_impressions > 0 then round((count(*)::numeric / v_totals_impressions::numeric), 6)
        else 0::numeric
      end as ctr
    from public.analytics_click_events
    where web_id = p_web_id and created_at >= p_from and created_at < p_to
      and track_key is not null
    group by track_key
    order by clicks desc
    limit 5
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
    where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to
      and pv.path ~ '^/blog/.+'
      and pv.path <> '/blog'
    group by pv.path, p.title
    order by impressions desc
    limit 5
  ) b;

  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
  into v_duration
  from (
    select path, round(avg(active_ms))::bigint as avg_ms
    from public.analytics_page_views
    where web_id = p_web_id and started_at >= p_from and started_at < p_to
      and (ended_at is not null or active_ms > 0)
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
    where web_id = p_web_id and started_at >= p_from and started_at < p_to
    group by 1, 2
    order by 1, 2
  ) h;

  select jsonb_build_object(
    'impressions',
    (select count(*)::bigint from public.analytics_page_views pv2
      where pv2.web_id = p_web_id and pv2.started_at >= p_from and pv2.started_at < p_to and pv2.path = '/service'),
    'contact_clicks_on_service',
    (select count(*)::bigint from public.analytics_click_events ce2
      where ce2.web_id = p_web_id and ce2.created_at >= p_from and ce2.created_at < p_to
        and ce2.path = '/service'
        and ce2.track_key = 'contact_cta'),
    'conversion',
    case
      when (select count(*) from public.analytics_page_views pv3
            where pv3.web_id = p_web_id and pv3.started_at >= p_from and pv3.started_at < p_to and pv3.path = '/service') > 0
      then round(
        (select count(*)::numeric from public.analytics_click_events ce3
          where ce3.web_id = p_web_id and ce3.created_at >= p_from and ce3.created_at < p_to
            and ce3.path = '/service'
            and ce3.track_key = 'contact_cta')
        / (select count(*)::numeric from public.analytics_page_views pv4
            where pv4.web_id = p_web_id and pv4.started_at >= p_from and pv4.started_at < p_to and pv4.path = '/service'),
        6
      )
      else 0::numeric
    end
  ) into v_service;

  return jsonb_build_object(
    'totals', jsonb_build_object(
      'impressions', v_totals_impressions,
      'clicks', v_totals_clicks,
      'unique_sessions', v_totals_sessions
    ),
    'daily', v_daily,
    'top_paths', v_top_paths,
    'top_track_keys', v_top_keys,
    'top_blog', v_top_blog,
    'duration_by_path', v_duration,
    'heatmap', v_heatmap,
    'service', v_service
  );
end;
$$;

comment on function public.admin_analytics_summary(timestamptz, timestamptz, text) is
  'CMS dashboard: aggregates for one web_id. top_paths: impressions, unique_sessions (distinct session_id on page_views), path_clicks (click_events.path), median_active_ms + avg_active_ms + duration_n (page_views with ended_at or active_ms>0).';
