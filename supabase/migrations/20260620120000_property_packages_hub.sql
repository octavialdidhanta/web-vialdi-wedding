-- Hub: merge wedding_packages + agency_packages → property_packages (web_id scoped).

begin;

-- ---------------------------------------------------------------------------
-- Helper: prefix storage path with web_id (skip if already prefixed)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- property_packages
-- ---------------------------------------------------------------------------
create table if not exists public.property_packages (
  id uuid primary key default gen_random_uuid(),
  web_id text not null references public.properties (slug) on delete restrict,
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
  updated_by uuid references auth.users (id) on delete set null
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

-- ---------------------------------------------------------------------------
-- Migrate wedding_packages → property_packages
-- ---------------------------------------------------------------------------
do $wedding$
begin
  if to_regclass('public.wedding_packages') is null then
    return;
  end if;

  insert into public.property_packages (
    id,
    web_id,
    slug,
    sort_order,
    is_published,
    badge_label,
    title,
    package_label,
    summary,
    strikethrough_price,
    price,
    promo_marquee_text,
    footer_note,
    footer_extra_html,
    promo_countdown_ends_at,
    footer_countdown_label,
    show_footer_countdown,
    show_best_seller,
    best_seller_image_path,
    best_seller_image_url,
    badge_image_path,
    badge_image_url,
    spent_budget_min,
    spent_budget_max,
    spent_budget_currency,
    spent_budget_period,
    fee_percent,
    sections,
    created_at,
    updated_at,
    updated_by
  )
  select
    w.id,
    'vialdi-wedding',
    w.slug,
    w.sort_order,
    w.is_published,
    w.badge_label,
    w.title,
    w.package_label,
    null,
    w.strikethrough_price,
    w.price,
    w.promo_marquee_text,
    w.footer_note,
    w.footer_extra_html,
    w.promo_countdown_ends_at,
    w.footer_countdown_label,
    w.show_footer_countdown,
    w.show_best_seller,
    public.prefix_package_media_path('vialdi-wedding', w.best_seller_image_path),
    w.best_seller_image_url,
    public.prefix_package_media_path('vialdi-wedding', w.badge_image_path),
    w.badge_image_url,
    null,
    null,
    null,
    null,
    null,
    w.sections,
    w.created_at,
    w.updated_at,
    w.updated_by
  from public.wedding_packages w
  on conflict (id) do nothing;
end;
$wedding$;

-- ---------------------------------------------------------------------------
-- Migrate agency_packages → property_packages
-- ---------------------------------------------------------------------------
do $agency$
begin
  if to_regclass('public.agency_packages') is null then
    return;
  end if;

  insert into public.property_packages (
    id,
    web_id,
    slug,
    sort_order,
    is_published,
    badge_label,
    title,
    package_label,
    summary,
    strikethrough_price,
    price,
    promo_marquee_text,
    footer_note,
    footer_extra_html,
    promo_countdown_ends_at,
    footer_countdown_label,
    show_footer_countdown,
    show_best_seller,
    best_seller_image_path,
    best_seller_image_url,
    badge_image_path,
    badge_image_url,
    spent_budget_min,
    spent_budget_max,
    spent_budget_currency,
    spent_budget_period,
    fee_percent,
    sections,
    created_at,
    updated_at,
    updated_by
  )
  select
    a.id,
    'vialdi',
    a.slug,
    a.sort_order,
    a.is_published,
    a.badge_label,
    a.title,
    a.package_label,
    a.summary,
    a.strikethrough_price,
    a.price,
    a.promo_marquee_text,
    a.footer_note,
    a.footer_extra_html,
    a.promo_countdown_ends_at,
    a.footer_countdown_label,
    a.show_footer_countdown,
    a.show_best_seller,
    public.prefix_package_media_path('vialdi', a.best_seller_image_path),
    a.best_seller_image_url,
    public.prefix_package_media_path('vialdi', a.badge_image_path),
    a.badge_image_url,
    a.spent_budget_min,
    a.spent_budget_max,
    a.spent_budget_currency,
    a.spent_budget_period,
    a.fee_percent,
    a.sections,
    a.created_at,
    a.updated_at,
    a.updated_by
  from public.agency_packages a
  on conflict (id) do nothing;
end;
$agency$;

-- ---------------------------------------------------------------------------
-- Storage: copy objects to package-media with web_id prefix
-- (metadata rows; physical files follow bucket/name in Supabase Storage)
-- ---------------------------------------------------------------------------
do $storage_copy$
declare
  r record;
  v_new_name text;
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage.objects not found — skip storage copy';
    return;
  end if;

  -- Wedding legacy paths in package-media → vialdi-wedding/...
  for r in
    select o.id, o.name, o.owner, o.owner_id, o.metadata, o.version
    from storage.objects o
    where o.bucket_id = 'package-media'
      and o.name is not null
      and o.name not like 'vialdi-wedding/%'
      and o.name not like 'vialdi/%'
  loop
    v_new_name := 'vialdi-wedding/' || r.name;
    if exists (
      select 1 from storage.objects x
      where x.bucket_id = 'package-media' and x.name = v_new_name
    ) then
      continue;
    end if;
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      owner_id,
      metadata,
      version
    )
    values (
      'package-media',
      v_new_name,
      r.owner,
      r.owner_id,
      coalesce(r.metadata, '{}'::jsonb),
      r.version
    );
  end loop;

  -- Agency bucket → package-media/vialdi/...
  for r in
    select o.id, o.name, o.owner, o.owner_id, o.metadata, o.version
    from storage.objects o
    where o.bucket_id = 'agency-package-media'
      and o.name is not null
  loop
    v_new_name := 'vialdi/' || r.name;
    if exists (
      select 1 from storage.objects x
      where x.bucket_id = 'package-media' and x.name = v_new_name
    ) then
      continue;
    end if;
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      owner_id,
      metadata,
      version
    )
    values (
      'package-media',
      v_new_name,
      r.owner,
      r.owner_id,
      coalesce(r.metadata, '{}'::jsonb),
      r.version
    );
  end loop;
end;
$storage_copy$;

-- ---------------------------------------------------------------------------
-- RLS: property_packages
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Storage policies: package-media (web_id prefix on new uploads)
-- Retire agency-package-media writes; keep read for transition
-- ---------------------------------------------------------------------------
drop policy if exists package_media_admin_insert on storage.objects;
create policy package_media_admin_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    and (
      name like 'vialdi-wedding/%'
      or name like 'vialdi/%'
      or name ~ '^[a-z0-9-]{3,64}/'
    )
  );

drop policy if exists agency_package_media_admin_insert on storage.objects;
create policy agency_package_media_admin_insert
  on storage.objects for insert
  to authenticated
  with check (false);

-- ---------------------------------------------------------------------------
-- Drop legacy tables
-- ---------------------------------------------------------------------------
drop table if exists public.wedding_packages cascade;
drop table if exists public.agency_packages cascade;

comment on table public.property_packages is
  'CMS packages per property (web_id). Merged from wedding_packages + agency_packages.';

commit;
