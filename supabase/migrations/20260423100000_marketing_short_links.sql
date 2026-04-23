-- Marketing short links: slug -> internal pathname + UTM (admin CRUD, public redirect via Edge Function + service role).

create table if not exists public.marketing_short_links (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null
    constraint marketing_short_links_slug_format
      check (slug ~ '^[a-z0-9-]{3,64}$'),
  pathname text not null
    constraint marketing_short_links_pathname_shape
      check (
        char_length(pathname) between 1 and 512
        and left(pathname, 1) = '/'
        and pathname not like '//%'
        and pathname not ilike '/admin%'
      ),
  utm_source text null
    constraint marketing_short_links_utm_source_len
      check (utm_source is null or char_length(utm_source) <= 200),
  utm_medium text null
    constraint marketing_short_links_utm_medium_len
      check (utm_medium is null or char_length(utm_medium) <= 200),
  utm_campaign text null
    constraint marketing_short_links_utm_campaign_len
      check (utm_campaign is null or char_length(utm_campaign) <= 200),
  utm_content text null
    constraint marketing_short_links_utm_content_len
      check (utm_content is null or char_length(utm_content) <= 200),
  utm_term text null
    constraint marketing_short_links_utm_term_len
      check (utm_term is null or char_length(utm_term) <= 200),
  active boolean not null default true,
  click_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users (id) on delete set null
);

create unique index if not exists marketing_short_links_slug_key
  on public.marketing_short_links (slug);

create index if not exists marketing_short_links_active_slug_idx
  on public.marketing_short_links (slug)
  where active = true;

drop trigger if exists set_marketing_short_links_updated_at on public.marketing_short_links;
create trigger set_marketing_short_links_updated_at
  before update on public.marketing_short_links
  for each row execute function public.set_updated_at();

alter table public.marketing_short_links enable row level security;

drop policy if exists "marketing_short_links_select_admin" on public.marketing_short_links;
create policy "marketing_short_links_select_admin"
  on public.marketing_short_links for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "marketing_short_links_insert_admin" on public.marketing_short_links;
create policy "marketing_short_links_insert_admin"
  on public.marketing_short_links for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "marketing_short_links_update_admin" on public.marketing_short_links;
create policy "marketing_short_links_update_admin"
  on public.marketing_short_links for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "marketing_short_links_delete_admin" on public.marketing_short_links;
create policy "marketing_short_links_delete_admin"
  on public.marketing_short_links for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- Atomic click increment for Edge Function (service_role).
create or replace function public.increment_marketing_short_link_click(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.marketing_short_links
  set click_count = click_count + 1
  where id = p_id and active = true;
$$;

revoke all on function public.increment_marketing_short_link_click(uuid) from public;
grant execute on function public.increment_marketing_short_link_click(uuid) to service_role;
