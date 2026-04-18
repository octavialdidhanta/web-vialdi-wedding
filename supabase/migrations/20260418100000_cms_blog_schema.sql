-- CMS blog: tables, RLS, storage bucket (vialdi.id)
--
-- First admin user (after Auth user exists). UUID must be in single quotes:
--   insert into public.cms_admins (user_id) values ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.cms_admins (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  featured boolean not null default false,
  accent text not null default 'navy'
    check (accent in ('navy', 'orange', 'emerald', 'violet')),
  cover_image_path text null,
  cover_image_url text null,
  body_json jsonb not null default '{}'::jsonb,
  body_html text not null default '',
  toc_json jsonb not null default '[]'::jsonb,
  read_time_minutes integer not null default 1,
  category_id uuid null references public.blog_categories (id) on delete set null,
  published_at timestamptz null,
  scheduled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users (id) on delete set null,
  updated_by uuid null references auth.users (id) on delete set null
);

create index if not exists idx_posts_status_published on public.posts (status, published_at desc nulls last);
create index if not exists idx_posts_category on public.posts (category_id);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists idx_post_tags_tag on public.post_tags (tag_id);

-- updated_at trigger (reuse if exists from other migrations)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists set_blog_categories_updated_at on public.blog_categories;
create trigger set_blog_categories_updated_at
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_blog_tags_updated_at on public.blog_tags;
create trigger set_blog_tags_updated_at
  before update on public.blog_tags
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.cms_admins enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;

-- cms_admins: user can see own row only
drop policy if exists "cms_admins_select_own" on public.cms_admins;
create policy "cms_admins_select_own"
  on public.cms_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- blog_categories: public read if used by a published post OR admin
drop policy if exists "blog_categories_select" on public.blog_categories;
create policy "blog_categories_select"
  on public.blog_categories for select
  using (
    exists (
      select 1 from public.posts p
      where p.category_id = blog_categories.id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
    or exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "blog_categories_insert_admin" on public.blog_categories;
create policy "blog_categories_insert_admin"
  on public.blog_categories for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "blog_categories_update_admin" on public.blog_categories;
create policy "blog_categories_update_admin"
  on public.blog_categories for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "blog_categories_delete_admin" on public.blog_categories;
create policy "blog_categories_delete_admin"
  on public.blog_categories for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- blog_tags
drop policy if exists "blog_tags_select" on public.blog_tags;
create policy "blog_tags_select"
  on public.blog_tags for select
  using (
    exists (
      select 1 from public.post_tags pt
      join public.posts p on p.id = pt.post_id
      where pt.tag_id = blog_tags.id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
    or exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "blog_tags_insert_admin" on public.blog_tags;
create policy "blog_tags_insert_admin"
  on public.blog_tags for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "blog_tags_update_admin" on public.blog_tags;
create policy "blog_tags_update_admin"
  on public.blog_tags for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "blog_tags_delete_admin" on public.blog_tags;
create policy "blog_tags_delete_admin"
  on public.blog_tags for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- posts: public read published
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists "posts_select_admin" on public.posts;
create policy "posts_select_admin"
  on public.posts for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "posts_insert_admin" on public.posts;
create policy "posts_insert_admin"
  on public.posts for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
  on public.posts for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- post_tags: follow post visibility for read; admin all
drop policy if exists "post_tags_select_public" on public.post_tags;
create policy "post_tags_select_public"
  on public.post_tags for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
  );

drop policy if exists "post_tags_select_admin" on public.post_tags;
create policy "post_tags_select_admin"
  on public.post_tags for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "post_tags_insert_admin" on public.post_tags;
create policy "post_tags_insert_admin"
  on public.post_tags for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "post_tags_update_admin" on public.post_tags;
create policy "post_tags_update_admin"
  on public.post_tags for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "post_tags_delete_admin" on public.post_tags;
create policy "post_tags_delete_admin"
  on public.post_tags for delete
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Storage: bucket blog-media (public read)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "blog_media_public_read" on storage.objects;
create policy "blog_media_public_read"
  on storage.objects for select
  using (bucket_id = 'blog-media');

drop policy if exists "blog_media_admin_insert" on storage.objects;
create policy "blog_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'blog-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "blog_media_admin_update" on storage.objects;
create policy "blog_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "blog_media_admin_delete" on storage.objects;
create policy "blog_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );
