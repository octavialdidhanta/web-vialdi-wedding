-- New schema for vialdi.id digital marketing articles (separate from legacy wedding posts).
-- IMPORTANT: does not modify existing `posts` / `blog_*` / `post_tags` tables.

create table if not exists public.agency_blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agency_blog_categories_updated_at
  before update on public.agency_blog_categories
  for each row execute function set_updated_at();

alter table public.agency_blog_categories enable row level security;

create policy "agency_blog_categories_select"
  on public.agency_blog_categories for select
  using (
    exists (
      select 1 from public.agency_posts p
      where p.category_id = agency_blog_categories.id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
    or exists (
      select 1 from public.cms_admins a
      where a.user_id = (select auth.uid())
    )
  );

create policy "agency_blog_categories_insert_admin"
  on public.agency_blog_categories for insert
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "agency_blog_categories_update_admin"
  on public.agency_blog_categories for update
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "agency_blog_categories_delete_admin"
  on public.agency_blog_categories for delete
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );


create table if not exists public.agency_blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agency_blog_tags_updated_at
  before update on public.agency_blog_tags
  for each row execute function set_updated_at();

alter table public.agency_blog_tags enable row level security;

create policy "agency_blog_tags_select"
  on public.agency_blog_tags for select
  using (
    exists (
      select 1
      from public.agency_post_tags pt
      join public.agency_posts p on p.id = pt.post_id
      where pt.tag_id = agency_blog_tags.id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
    or exists (
      select 1 from public.cms_admins a
      where a.user_id = (select auth.uid())
    )
  );

create policy "agency_blog_tags_insert_admin"
  on public.agency_blog_tags for insert
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "agency_blog_tags_update_admin"
  on public.agency_blog_tags for update
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "agency_blog_tags_delete_admin"
  on public.agency_blog_tags for delete
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );


create table if not exists public.agency_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  status text not null default 'draft',
  featured boolean not null default false,
  accent text not null default 'navy',
  cover_image_path text,
  cover_image_url text,
  body_json jsonb not null default '{}'::jsonb,
  body_html text not null default '',
  toc_json jsonb not null default '[]'::jsonb,
  read_time_minutes int not null default 1,
  category_id uuid references public.agency_blog_categories(id) on delete set null,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_agency_posts_category on public.agency_posts(category_id);
create index if not exists idx_agency_posts_status_published on public.agency_posts(status, published_at desc nulls last);

create trigger set_agency_posts_updated_at
  before update on public.agency_posts
  for each row execute function set_updated_at();

alter table public.agency_posts enable row level security;

create policy "agency_posts_select"
  on public.agency_posts for select
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    or (
      (status = 'published' and published_at is not null and published_at <= now())
      or (status = 'scheduled' and scheduled_at is not null and scheduled_at <= now())
    )
  );

create policy "agency_posts_insert_admin"
  on public.agency_posts for insert
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

create policy "agency_posts_update_admin"
  on public.agency_posts for update
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

create policy "agency_posts_delete_admin"
  on public.agency_posts for delete
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));


create table if not exists public.agency_post_tags (
  post_id uuid not null references public.agency_posts(id) on delete cascade,
  tag_id uuid not null references public.agency_blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists idx_agency_post_tags_tag on public.agency_post_tags(tag_id);

alter table public.agency_post_tags enable row level security;

create policy "agency_post_tags_select"
  on public.agency_post_tags for select
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    or exists (
      select 1 from public.agency_posts p
      where p.id = agency_post_tags.post_id
        and (
          (p.status = 'published' and p.published_at is not null and p.published_at <= now())
          or (p.status = 'scheduled' and p.scheduled_at is not null and p.scheduled_at <= now())
        )
    )
  );

create policy "agency_post_tags_insert_admin"
  on public.agency_post_tags for insert
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

create policy "agency_post_tags_update_admin"
  on public.agency_post_tags for update
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

create policy "agency_post_tags_delete_admin"
  on public.agency_post_tags for delete
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

