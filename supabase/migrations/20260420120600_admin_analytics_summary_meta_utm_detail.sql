-- CMS admin_analytics_summary: UTM + per baris meta_* (max per bucket UTM); acquisition_top_meta_ads tetap untuk API. Depends on meta_* columns (20260420120000).

create or replace function public.admin_analytics_summary(p_from timestamptz, p_to timestamptz, p_web_id text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
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

  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  if p_to < p_from then
    raise exception 'invalid range' using errcode = '22023';
  end if;

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
    with
      impressions_total as (
        select count(*)::bigint as n
        from public.analytics_page_views
        where web_id = p_web_id and started_at >= p_from and started_at < p_to
      ),
      key_counts as (
        select
          track_key,
          count(*)::bigint as clicks
        from public.analytics_click_events
        where web_id = p_web_id and created_at >= p_from and created_at < p_to
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
          where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to
        ) act
        inner join public.analytics_sessions s
          on s.id = act.session_id and s.web_id = p_web_id
      ) sc
    ) ch
    group by channel
  ) a;

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
      where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to
    ) act
    inner join public.analytics_sessions s on s.id = act.session_id and s.web_id = p_web_id
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
      where pv.web_id = p_web_id and pv.started_at >= p_from and pv.started_at < p_to
    ) act
    inner join public.analytics_sessions s on s.id = act.session_id and s.web_id = p_web_id
    where
      nullif(btrim(s.meta_campaign_name), '') is not null
      or nullif(btrim(s.meta_adset_name), '') is not null
      or nullif(btrim(s.meta_ad_name), '') is not null
    group by 1, 2, 3
    order by sessions desc
    limit 20
  ) m;

  -- jsonb_build_object di RETURN menilai argumen sebagai SQL; pakai USING agar variabel PL tidak disalahartikan sebagai relasi.
  v_totals_part := jsonb_build_object(
    'impressions',
    (select count(*)::bigint
     from public.analytics_page_views pv_tot
     where pv_tot.web_id = p_web_id and pv_tot.started_at >= p_from and pv_tot.started_at < p_to),
    'clicks',
    (select count(*)::bigint
     from public.analytics_click_events ce_tot
     where ce_tot.web_id = p_web_id and ce_tot.created_at >= p_from and ce_tot.created_at < p_to),
    'unique_sessions',
    (select count(distinct pv_tot2.session_id)::bigint
     from public.analytics_page_views pv_tot2
     where pv_tot2.web_id = p_web_id and pv_tot2.started_at >= p_from and pv_tot2.started_at < p_to)
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


comment on function public.admin_analytics_summary(timestamptz, timestamptz, text) is
  'CMS dashboard: aggregates for one web_id. acquisition_top_campaigns includes utm_* plus meta_* (max per UTM bucket); acquisition_top_meta_ads groups by meta_* only.';
