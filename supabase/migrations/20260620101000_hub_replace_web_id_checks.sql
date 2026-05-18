-- Hub: canonical web_id helpers, drop enum CHECK constraints, FK to properties.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.resolve_canonical_web_id(p_raw text)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when p_raw is null or btrim(p_raw) = '' then null
    else coalesce(
      (select a.canonical_slug
       from public.property_web_id_aliases a
       where a.alias = lower(btrim(p_raw))),
      (select p.slug
       from public.properties p
       where p.slug = lower(btrim(p_raw)))
    )
  end;
$$;

create or replace function public.is_active_property(p_web_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.slug = public.resolve_canonical_web_id(p_web_id)
      and p.is_active
  );
$$;

comment on function public.is_active_property(text) is
  'True when p_web_id resolves to an active properties.slug (via aliases).';

create or replace function public.hub_require_active_web_id(p_web_id text, p_allow_null boolean default false)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  w text;
begin
  if p_allow_null and (p_web_id is null or btrim(p_web_id) = '') then
    return null;
  end if;
  w := public.resolve_canonical_web_id(p_web_id);
  if w is null then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;
  if not exists (select 1 from public.properties p where p.slug = w and p.is_active) then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;
  return w;
end;
$$;

-- ---------------------------------------------------------------------------
-- Drop legacy CHECK constraints; add FK to properties
-- ---------------------------------------------------------------------------
alter table public.analytics_sessions drop constraint if exists analytics_sessions_web_id_check;
alter table public.analytics_page_views drop constraint if exists analytics_page_views_web_id_check;
alter table public.analytics_click_events drop constraint if exists analytics_click_events_web_id_check;
alter table public.analytics_daily_source_breakdown drop constraint if exists analytics_daily_source_breakdown_web_id_check;
alter table public.analytics_daily_utm drop constraint if exists analytics_daily_utm_web_id_check;
alter table public.posts drop constraint if exists posts_web_id_check;

alter table public.analytics_sessions drop constraint if exists analytics_sessions_web_id_fkey;
alter table public.analytics_sessions
  add constraint analytics_sessions_web_id_fkey
  foreign key (web_id) references public.properties (slug);

alter table public.analytics_page_views drop constraint if exists analytics_page_views_web_id_fkey;
alter table public.analytics_page_views
  add constraint analytics_page_views_web_id_fkey
  foreign key (web_id) references public.properties (slug);

alter table public.analytics_click_events drop constraint if exists analytics_click_events_web_id_fkey;
alter table public.analytics_click_events
  add constraint analytics_click_events_web_id_fkey
  foreign key (web_id) references public.properties (slug);

alter table public.analytics_daily_source_breakdown drop constraint if exists analytics_daily_source_breakdown_web_id_fkey;
alter table public.analytics_daily_source_breakdown
  add constraint analytics_daily_source_breakdown_web_id_fkey
  foreign key (web_id) references public.properties (slug);

alter table public.analytics_daily_utm drop constraint if exists analytics_daily_utm_web_id_fkey;
alter table public.analytics_daily_utm
  add constraint analytics_daily_utm_web_id_fkey
  foreign key (web_id) references public.properties (slug);

alter table public.posts drop constraint if exists posts_web_id_fkey;
alter table public.posts
  add constraint posts_web_id_fkey
  foreign key (web_id) references public.properties (slug);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'analytics_web_access' and column_name = 'web_id'
  ) then
    alter table public.analytics_web_access drop constraint if exists analytics_web_access_web_id_fkey;
    alter table public.analytics_web_access
      add constraint analytics_web_access_web_id_fkey
      foreign key (web_id) references public.properties (slug);
  end if;
end $$;

create or replace function public.admin_blog_post_page_view_totals(p_web_id text)
returns table(path text, total_views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w text;
begin
  w := public.hub_require_active_web_id(p_web_id, false);

  return query
  select pv.path, count(*)::bigint as total_views
  from public.analytics_page_views pv
  where pv.web_id = w
    and pv.path ~ '^/blog/[^/]+$'
  group by pv.path;
end;
$$;
