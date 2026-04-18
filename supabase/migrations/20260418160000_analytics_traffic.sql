-- First-party analytics: sessions, page views (impressions + active duration), click events.
--
-- Impression (SPA): satu baris analytics_page_views per navigasi pathname di klien (bukan full reload).
-- Exit rate (proxy SPA): tidak disimpan sebagai kolom; bisa didekati dari sesi yang page_view terakhirnya
--   ber-path X dibanding jumlah page_view pada X (lihat komentar di dashboard admin).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_sessions (
  id uuid not null primary key,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  auth_user_id uuid null references auth.users (id) on delete set null,
  referrer text null,
  ua_hash text null
);

create index if not exists idx_analytics_sessions_last_seen on public.analytics_sessions (last_seen_at desc);

create table if not exists public.analytics_page_views (
  id uuid not null default gen_random_uuid() primary key,
  session_id uuid not null references public.analytics_sessions (id) on delete cascade,
  path text not null,
  started_at timestamptz not null default now(),
  active_ms bigint not null default 0,
  ended_at timestamptz null,
  scroll_max_pct smallint null
);

create index if not exists idx_analytics_page_views_session_started
  on public.analytics_page_views (session_id, started_at desc);
create index if not exists idx_analytics_page_views_path_started
  on public.analytics_page_views (path, started_at desc);
create index if not exists idx_analytics_page_views_open
  on public.analytics_page_views (session_id) where ended_at is null;

comment on table public.analytics_page_views is 'Page views / impressions SPA + active_ms (waktu tab fokus, di-heartbeat klien).';

create table if not exists public.analytics_click_events (
  id uuid not null default gen_random_uuid() primary key,
  session_id uuid not null references public.analytics_sessions (id) on delete cascade,
  path text not null,
  track_key text null,
  element_type text not null,
  element_label text not null default '',
  target_url text null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_clicks_session on public.analytics_click_events (session_id, created_at desc);
create index if not exists idx_analytics_clicks_path on public.analytics_click_events (path, created_at desc);
create index if not exists idx_analytics_clicks_track_key on public.analytics_click_events (track_key, created_at desc)
  where track_key is not null;

-- ---------------------------------------------------------------------------
-- RLS: no public access; CMS admins read; writes only via service role (Edge)
-- ---------------------------------------------------------------------------

alter table public.analytics_sessions enable row level security;
alter table public.analytics_page_views enable row level security;
alter table public.analytics_click_events enable row level security;

drop policy if exists "analytics_sessions_select_admin" on public.analytics_sessions;
create policy "analytics_sessions_select_admin"
  on public.analytics_sessions for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "analytics_page_views_select_admin" on public.analytics_page_views;
create policy "analytics_page_views_select_admin"
  on public.analytics_page_views for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "analytics_click_events_select_admin" on public.analytics_click_events;
create policy "analytics_click_events_select_admin"
  on public.analytics_click_events for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- RPC: single JSON payload for dashboard (Asia/Jakarta calendar day buckets)
-- ---------------------------------------------------------------------------

create or replace function public.admin_analytics_summary(p_from timestamptz, p_to timestamptz)
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

  if p_to < p_from then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  select count(*)::bigint into v_totals_impressions
  from public.analytics_page_views pv
  where pv.started_at >= p_from and pv.started_at < p_to;

  select count(*)::bigint into v_totals_clicks
  from public.analytics_click_events ce
  where ce.created_at >= p_from and ce.created_at < p_to;

  select count(distinct pv.session_id)::bigint into v_totals_sessions
  from public.analytics_page_views pv
  where pv.started_at >= p_from and pv.started_at < p_to;

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
      where started_at >= p_from and started_at < p_to
      union
      select distinct date_trunc('day', created_at at time zone 'Asia/Jakarta') as day
      from public.analytics_click_events
      where created_at >= p_from and created_at < p_to
    ) x
    left join (
      select
        date_trunc('day', started_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as impressions
      from public.analytics_page_views
      where started_at >= p_from and started_at < p_to
      group by 1
    ) i on i.day = x.day
    left join (
      select
        date_trunc('day', created_at at time zone 'Asia/Jakarta') as day,
        count(*)::bigint as clicks
      from public.analytics_click_events
      where created_at >= p_from and created_at < p_to
      group by 1
    ) c on c.day = x.day
  ) d;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_top_paths
  from (
    select path, count(*)::bigint as impressions
    from public.analytics_page_views
    where started_at >= p_from and started_at < p_to
    group by path
    order by impressions desc
    limit 10
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
    where created_at >= p_from and created_at < p_to
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
    where pv.started_at >= p_from and pv.started_at < p_to
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
    where started_at >= p_from and started_at < p_to
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
    where started_at >= p_from and started_at < p_to
    group by 1, 2
    order by 1, 2
  ) h;

  select jsonb_build_object(
    'impressions',
    (select count(*)::bigint from public.analytics_page_views pv2
      where pv2.started_at >= p_from and pv2.started_at < p_to and pv2.path = '/service'),
    'contact_clicks_on_service',
    (select count(*)::bigint from public.analytics_click_events ce2
      where ce2.created_at >= p_from and ce2.created_at < p_to
        and ce2.path = '/service'
        and ce2.track_key = 'contact_cta'),
    'conversion',
    case
      when (select count(*) from public.analytics_page_views pv3
            where pv3.started_at >= p_from and pv3.started_at < p_to and pv3.path = '/service') > 0
      then round(
        (select count(*)::numeric from public.analytics_click_events ce3
          where ce3.created_at >= p_from and ce3.created_at < p_to
            and ce3.path = '/service'
            and ce3.track_key = 'contact_cta')
        / (select count(*)::numeric from public.analytics_page_views pv4
            where pv4.started_at >= p_from and pv4.started_at < p_to and pv4.path = '/service'),
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

revoke all on public.analytics_sessions from public;
revoke all on public.analytics_page_views from public;
revoke all on public.analytics_click_events from public;

grant select on public.analytics_sessions to authenticated;
grant select on public.analytics_page_views to authenticated;
grant select on public.analytics_click_events to authenticated;

grant execute on function public.admin_analytics_summary(timestamptz, timestamptz) to authenticated;

comment on function public.admin_analytics_summary(timestamptz, timestamptz) is
  'CMS dashboard: aggregates page_views as impressions and click_events; CTR uses global impressions denominator.';

-- Called only from Edge (service_role): safe upsert for session without wiping started_at.
create or replace function public.analytics_session_touch(
  p_session uuid,
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
  insert into public.analytics_sessions (id, referrer, ua_hash, auth_user_id)
  values (
    p_session,
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_ua_hash), ''), 64),
    p_auth
  )
  on conflict (id) do update set
    last_seen_at = now(),
    referrer = coalesce(excluded.referrer, public.analytics_sessions.referrer),
    ua_hash = coalesce(excluded.ua_hash, public.analytics_sessions.ua_hash),
    auth_user_id = coalesce(excluded.auth_user_id, public.analytics_sessions.auth_user_id);
end;
$$;

revoke all on function public.analytics_session_touch(uuid, text, text, uuid) from public;
grant execute on function public.analytics_session_touch(uuid, text, text, uuid) to service_role;
