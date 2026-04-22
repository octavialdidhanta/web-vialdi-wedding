-- Wedding package CMS: table, RLS (mirror posts/cms_admins), storage bucket package-media

create table if not exists public.wedding_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order int not null default 0,
  is_published boolean not null default false,
  badge_label text not null default '',
  title text not null,
  package_label text not null,
  strikethrough_price text,
  price text not null,
  promo_marquee_text text,
  footer_note text,
  footer_extra_html text,
  show_best_seller boolean not null default false,
  best_seller_image_path text,
  best_seller_image_url text,
  badge_image_path text,
  badge_image_url text,
  promo_countdown_ends_at timestamptz,
  footer_countdown_label text,
  show_footer_countdown boolean not null default false,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_wedding_packages_published_sort
  on public.wedding_packages (is_published, sort_order);

drop trigger if exists set_wedding_packages_updated_at on public.wedding_packages;
create trigger set_wedding_packages_updated_at
  before update on public.wedding_packages
  for each row execute function public.set_updated_at();

alter table public.wedding_packages enable row level security;

drop policy if exists "wedding_packages_select_public" on public.wedding_packages;
create policy "wedding_packages_select_public"
  on public.wedding_packages for select
  using (is_published = true);

drop policy if exists "wedding_packages_select_admin" on public.wedding_packages;
create policy "wedding_packages_select_admin"
  on public.wedding_packages for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "wedding_packages_insert_admin" on public.wedding_packages;
create policy "wedding_packages_insert_admin"
  on public.wedding_packages for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "wedding_packages_update_admin" on public.wedding_packages;
create policy "wedding_packages_update_admin"
  on public.wedding_packages for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "wedding_packages_delete_admin" on public.wedding_packages;
create policy "wedding_packages_delete_admin"
  on public.wedding_packages for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'package-media',
  'package-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "package_media_public_read" on storage.objects;
create policy "package_media_public_read"
  on storage.objects for select
  using (bucket_id = 'package-media');

drop policy if exists "package_media_admin_insert" on storage.objects;
create policy "package_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "package_media_admin_update" on storage.objects;
create policy "package_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "package_media_admin_delete" on storage.objects;
create policy "package_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );
