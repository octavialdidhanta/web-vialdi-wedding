-- Multi-property analytics: slug web_id per row. Domain → slug via VITE_WEB_ID di build (bukan di DB).

alter table public.analytics_sessions add column if not exists web_id text;
alter table public.analytics_page_views add column if not exists web_id text;
alter table public.analytics_click_events add column if not exists web_id text;

update public.analytics_sessions set web_id = 'vialdi' where web_id is null;
update public.analytics_page_views set web_id = 'vialdi' where web_id is null;
update public.analytics_click_events set web_id = 'vialdi' where web_id is null;

alter table public.analytics_sessions alter column web_id set not null;
alter table public.analytics_page_views alter column web_id set not null;
alter table public.analytics_click_events alter column web_id set not null;

alter table public.analytics_sessions drop constraint if exists analytics_sessions_web_id_check;
alter table public.analytics_sessions
  add constraint analytics_sessions_web_id_check
  check (web_id in ('vialdi', 'vialdi-wedding', 'synckerja'));

alter table public.analytics_page_views drop constraint if exists analytics_page_views_web_id_check;
alter table public.analytics_page_views
  add constraint analytics_page_views_web_id_check
  check (web_id in ('vialdi', 'vialdi-wedding', 'synckerja'));

alter table public.analytics_click_events drop constraint if exists analytics_click_events_web_id_check;
alter table public.analytics_click_events
  add constraint analytics_click_events_web_id_check
  check (web_id in ('vialdi', 'vialdi-wedding', 'synckerja'));

create index if not exists idx_analytics_sessions_web_last_seen
  on public.analytics_sessions (web_id, last_seen_at desc);

create index if not exists idx_analytics_page_views_web_started
  on public.analytics_page_views (web_id, started_at desc);

create index if not exists idx_analytics_page_views_web_path_started
  on public.analytics_page_views (web_id, path, started_at desc);

create index if not exists idx_analytics_clicks_web_created
  on public.analytics_click_events (web_id, created_at desc);

-- Replace RPC: drop old signatures (avoid overload confusion).
revoke execute on function public.admin_analytics_summary(timestamptz, timestamptz) from authenticated;
drop function if exists public.admin_analytics_summary(timestamptz, timestamptz);

revoke execute on function public.analytics_session_touch(uuid, text, text, uuid) from service_role;
drop function if exists public.analytics_session_touch(uuid, text, text, uuid);

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

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_top_paths
  from (
    select path, count(*)::bigint as impressions
    from public.analytics_page_views
    where web_id = p_web_id and started_at >= p_from and started_at < p_to
    group by path
    order by impressions desc
    limit 10
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
      'service', $8::jsonb
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
    v_service;

  return v_summary;
end;
$$;

grant execute on function public.admin_analytics_summary(timestamptz, timestamptz, text) to authenticated;

comment on function public.admin_analytics_summary(timestamptz, timestamptz, text) is
  'CMS dashboard: aggregates for one web_id (vialdi | vialdi-wedding | synckerja); CTR uses impressions in range for that web_id.';

create or replace function public.analytics_session_touch(
  p_session uuid,
  p_web_id text,
  p_referrer text,
  p_ua_hash text,
  p_auth uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  insert into public.analytics_sessions (id, web_id, referrer, ua_hash, auth_user_id)
  values (
    p_session,
    p_web_id,
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_ua_hash), ''), 64),
    p_auth
  )
  on conflict (id) do update set
    last_seen_at = now(),
    web_id = excluded.web_id,
    referrer = coalesce(excluded.referrer, public.analytics_sessions.referrer),
    ua_hash = coalesce(excluded.ua_hash, public.analytics_sessions.ua_hash),
    auth_user_id = coalesce(excluded.auth_user_id, public.analytics_sessions.auth_user_id);
end;
$$;

revoke all on function public.analytics_session_touch(uuid, text, text, text, uuid) from public;
grant execute on function public.analytics_session_touch(uuid, text, text, text, uuid) to service_role;
