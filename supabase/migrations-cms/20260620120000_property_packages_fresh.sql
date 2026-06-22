-- CMS fresh: property_packages + package-media (tanpa FK ke properties).

begin;

create or replace function public.prefix_package_media_path(p_web_id text, p_path text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select case
    when p_path is null or btrim(p_path) = '' then null
    when p_path like p_web_id || '/%' then p_path
    else p_web_id || '/' || ltrim(p_path, '/')
  end;
$$;

create table if not exists public.property_packages (
  id uuid primary key default gen_random_uuid(),
  web_id text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  badge_label text not null default '',
  title text not null,
  package_label text not null,
  summary text,
  strikethrough_price text,
  price text not null,
  promo_marquee_text text,
  footer_note text,
  footer_extra_html text,
  promo_countdown_ends_at timestamptz,
  footer_countdown_label text,
  show_footer_countdown boolean not null default false,
  show_best_seller boolean not null default false,
  best_seller_image_path text,
  best_seller_image_url text,
  badge_image_path text,
  badge_image_url text,
  spent_budget_min numeric,
  spent_budget_max numeric,
  spent_budget_currency text,
  spent_budget_period text,
  fee_percent numeric,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint property_packages_web_id_check
    check (web_id in ('vialdi-wedding', 'vialdi', 'synckerja'))
);

create unique index if not exists property_packages_web_id_slug_key
  on public.property_packages (web_id, slug);

create index if not exists idx_property_packages_published_sort
  on public.property_packages (web_id, is_published, sort_order);

create index if not exists idx_property_packages_spent_range
  on public.property_packages (web_id, spent_budget_min, spent_budget_max);

create index if not exists idx_property_packages_fee_percent
  on public.property_packages (web_id, fee_percent)
  where fee_percent is not null;

drop trigger if exists set_property_packages_updated_at on public.property_packages;
create trigger set_property_packages_updated_at
  before update on public.property_packages
  for each row execute function public.set_updated_at();

alter table public.property_packages enable row level security;

drop policy if exists property_packages_select on public.property_packages;
create policy property_packages_select
  on public.property_packages for select
  using (
    is_published = true
    or public.is_cms_admin()
  );

drop policy if exists property_packages_insert_admin on public.property_packages;
create policy property_packages_insert_admin
  on public.property_packages for insert
  to authenticated
  with check (public.is_cms_admin());

drop policy if exists property_packages_update_admin on public.property_packages;
create policy property_packages_update_admin
  on public.property_packages for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists property_packages_delete_admin on public.property_packages;
create policy property_packages_delete_admin
  on public.property_packages for delete
  to authenticated
  using (public.is_cms_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'package-media',
  'package-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists package_media_public_read on storage.objects;
create policy package_media_public_read
  on storage.objects for select
  using (bucket_id = 'package-media');

drop policy if exists package_media_admin_insert on storage.objects;
create policy package_media_admin_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'package-media'
    and public.is_cms_admin()
    and (
      name like 'vialdi-wedding/%'
      or name like 'vialdi/%'
      or name like 'synckerja/%'
    )
  );

drop policy if exists package_media_admin_update on storage.objects;
create policy package_media_admin_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'package-media'
    and public.is_cms_admin()
  );

drop policy if exists package_media_admin_delete on storage.objects;
create policy package_media_admin_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'package-media'
    and public.is_cms_admin()
  );

drop table if exists public.agency_packages cascade;

comment on table public.property_packages is
  'CMS packages per property (web_id). Replaces agency_packages on fresh CMS installs.';

commit;
