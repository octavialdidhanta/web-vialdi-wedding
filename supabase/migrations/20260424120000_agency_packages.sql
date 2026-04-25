-- Agency package CMS: table, RLS (mirror `wedding_packages`), storage bucket agency-package-media

create table if not exists public.agency_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order int not null default 0,
  is_published boolean not null default false,

  -- Display fields
  badge_label text not null default '',
  title text not null,
  package_label text not null,
  summary text,

  -- Pricing
  strikethrough_price text,
  price text not null,

  -- Promo / footer
  promo_marquee_text text,
  footer_note text,
  footer_extra_html text,
  promo_countdown_ends_at timestamptz,
  footer_countdown_label text,
  show_footer_countdown boolean not null default false,

  -- Optional badges/images (stored in storage bucket)
  show_best_seller boolean not null default false,
  best_seller_image_path text,
  best_seller_image_url text,
  badge_image_path text,
  badge_image_url text,

  -- Package detail sections (accordion). Flexible to support bullets, bonus lines, etc.
  sections jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_agency_packages_published_sort
  on public.agency_packages (is_published, sort_order);

drop trigger if exists set_agency_packages_updated_at on public.agency_packages;
create trigger set_agency_packages_updated_at
  before update on public.agency_packages
  for each row execute function public.set_updated_at();

alter table public.agency_packages enable row level security;

drop policy if exists "agency_packages_select_public" on public.agency_packages;
create policy "agency_packages_select_public"
  on public.agency_packages for select
  using (is_published = true);

drop policy if exists "agency_packages_select_admin" on public.agency_packages;
create policy "agency_packages_select_admin"
  on public.agency_packages for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "agency_packages_insert_admin" on public.agency_packages;
create policy "agency_packages_insert_admin"
  on public.agency_packages for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "agency_packages_update_admin" on public.agency_packages;
create policy "agency_packages_update_admin"
  on public.agency_packages for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "agency_packages_delete_admin" on public.agency_packages;
create policy "agency_packages_delete_admin"
  on public.agency_packages for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- Storage bucket for agency package media (separate from wedding packages)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agency-package-media',
  'agency-package-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "agency_package_media_public_read" on storage.objects;
create policy "agency_package_media_public_read"
  on storage.objects for select
  using (bucket_id = 'agency-package-media');

drop policy if exists "agency_package_media_admin_insert" on storage.objects;
create policy "agency_package_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'agency-package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "agency_package_media_admin_update" on storage.objects;
create policy "agency_package_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'agency-package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "agency_package_media_admin_delete" on storage.objects;
create policy "agency_package_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'agency-package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

