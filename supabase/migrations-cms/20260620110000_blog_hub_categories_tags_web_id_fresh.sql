-- Blog hub: blog_categories / blog_tags scoped by web_id; merge agency_blog_*; posts (web_id, slug) unique.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.cms_admins a
    where a.user_id = (select auth.uid())
  );
$$;

create or replace function public.post_is_public_readable(
  p_status text,
  p_published_at timestamptz,
  p_scheduled_at timestamptz
)
returns boolean
language sql
stable
set search_path to 'public'
as $$
  select (
    p_status = 'published'
    and p_published_at is not null
    and p_published_at <= now()
  ) or (
    p_status = 'scheduled'
    and p_scheduled_at is not null
    and p_scheduled_at <= now()
  );
$$;

-- ---------------------------------------------------------------------------
-- blog_categories + blog_tags: web_id column
-- ---------------------------------------------------------------------------
alter table public.blog_categories add column if not exists web_id text;
alter table public.blog_tags add column if not exists web_id text;

update public.blog_categories
set web_id = 'vialdi-wedding'
where web_id is null;

update public.blog_categories c
set web_id = coalesce(
  (
    select p.web_id
    from public.posts p
    where p.category_id = c.id
    limit 1
  ),
  'vialdi-wedding'
)
where web_id is null;

update public.blog_tags
set web_id = 'vialdi-wedding'
where web_id is null;

update public.blog_tags t
set web_id = coalesce(
  (
    select p.web_id
    from public.post_tags pt
    join public.posts p on p.id = pt.post_id
    where pt.tag_id = t.id
    limit 1
  ),
  'vialdi-wedding'
)
where web_id is null;

-- Unique (web_id, slug) on taxonomy tables
alter table public.blog_categories drop constraint if exists blog_categories_slug_key;
drop index if exists public.blog_categories_slug_key;
alter table public.blog_tags drop constraint if exists blog_tags_slug_key;
drop index if exists public.blog_tags_slug_key;

create unique index if not exists blog_categories_web_id_slug_key
  on public.blog_categories (web_id, slug);

create unique index if not exists blog_tags_web_id_slug_key
  on public.blog_tags (web_id, slug);

-- ---------------------------------------------------------------------------
-- Merge agency_blog_categories → blog_categories (if present)
-- ---------------------------------------------------------------------------
do $merge_cat$
declare
  r record;
  v_web text;
  v_new_id uuid;
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'agency_blog_categories'
  ) then
    return;
  end if;

  for r in select * from public.agency_blog_categories loop
    select coalesce(
      (select p.web_id from public.posts p where p.category_id = r.id limit 1),
      'vialdi-wedding'
    )
    into v_web;

    insert into public.blog_categories (slug, name, web_id, created_at, updated_at)
    values (r.slug, r.name, v_web, r.created_at, r.updated_at)
    on conflict (web_id, slug) do update
      set
        name = excluded.name,
        updated_at = excluded.updated_at;

    select id into v_new_id
    from public.blog_categories
    where web_id = v_web and slug = r.slug;

    update public.posts
    set category_id = v_new_id
    where category_id = r.id;
  end loop;
end;
$merge_cat$;

-- ---------------------------------------------------------------------------
-- Merge agency_blog_tags → blog_tags (if present)
-- ---------------------------------------------------------------------------
do $merge_tag$
declare
  r record;
  v_web text;
  v_new_id uuid;
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'agency_blog_tags'
  ) then
    return;
  end if;

  for r in select * from public.agency_blog_tags loop
    select coalesce(
      (
        select p.web_id
        from public.post_tags pt
        join public.posts p on p.id = pt.post_id
        where pt.tag_id = r.id
        limit 1
      ),
      'vialdi-wedding'
    )
    into v_web;

    insert into public.blog_tags (slug, name, web_id, created_at, updated_at)
    values (r.slug, r.name, v_web, r.created_at, r.updated_at)
    on conflict (web_id, slug) do update
      set
        name = excluded.name,
        updated_at = excluded.updated_at;

    select id into v_new_id
    from public.blog_tags
    where web_id = v_web and slug = r.slug;

    update public.post_tags
    set tag_id = v_new_id
    where tag_id = r.id;
  end loop;
end;
$merge_tag$;

alter table public.blog_categories alter column web_id set not null;
alter table public.blog_tags alter column web_id set not null;

alter table public.blog_categories drop constraint if exists blog_categories_web_id_fkey;
alter table public.blog_categories drop constraint if exists blog_categories_web_id_check;
alter table public.blog_categories
  add constraint blog_categories_web_id_check
  check (web_id in ('vialdi-wedding', 'vialdi', 'synckerja'));

alter table public.blog_tags drop constraint if exists blog_tags_web_id_fkey;
alter table public.blog_tags drop constraint if exists blog_tags_web_id_check;
alter table public.blog_tags
  add constraint blog_tags_web_id_check
  check (web_id in ('vialdi-wedding', 'vialdi', 'synckerja'));

-- posts.category_id → blog_categories
alter table public.posts drop constraint if exists posts_category_id_fkey;
alter table public.posts drop constraint if exists agency_posts_category_id_fkey;

alter table public.posts
  add constraint posts_category_id_fkey
  foreign key (category_id) references public.blog_categories (id) on delete set null;

-- post_tags.tag_id → blog_tags
alter table public.post_tags drop constraint if exists post_tags_tag_id_fkey;
alter table public.post_tags drop constraint if exists agency_post_tags_tag_id_fkey;

alter table public.post_tags
  add constraint post_tags_tag_id_fkey
  foreign key (tag_id) references public.blog_tags (id) on delete cascade;

-- Drop agency taxonomy tables
drop policy if exists "agency_blog_categories_select" on public.agency_blog_categories;
drop policy if exists "agency_blog_categories_insert_admin" on public.agency_blog_categories;
drop policy if exists "agency_blog_categories_update_admin" on public.agency_blog_categories;
drop policy if exists "agency_blog_categories_delete_admin" on public.agency_blog_categories;
drop table if exists public.agency_blog_categories cascade;

drop policy if exists "agency_blog_tags_select" on public.agency_blog_tags;
drop policy if exists "agency_blog_tags_insert_admin" on public.agency_blog_tags;
drop policy if exists "agency_blog_tags_update_admin" on public.agency_blog_tags;
drop policy if exists "agency_blog_tags_delete_admin" on public.agency_blog_tags;
drop table if exists public.agency_blog_tags cascade;

-- posts: unique (web_id, slug)
alter table public.posts drop constraint if exists posts_slug_key;
drop index if exists public.posts_slug_key;

create unique index if not exists posts_web_id_slug_key
  on public.posts (web_id, slug);

-- ---------------------------------------------------------------------------
-- RLS: posts
-- ---------------------------------------------------------------------------
drop policy if exists posts_select on public.posts;
drop policy if exists posts_insert_admin on public.posts;
drop policy if exists posts_update_admin on public.posts;
drop policy if exists posts_delete_admin on public.posts;

create policy posts_select
  on public.posts for select
  using (
    public.is_cms_admin()
    or public.post_is_public_readable(status, published_at, scheduled_at)
  );

create policy posts_insert_admin
  on public.posts for insert
  to authenticated
  with check (public.is_cms_admin());

create policy posts_update_admin
  on public.posts for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy posts_delete_admin
  on public.posts for delete
  to authenticated
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- RLS: post_tags
-- ---------------------------------------------------------------------------
drop policy if exists post_tags_select on public.post_tags;
drop policy if exists post_tags_insert_admin on public.post_tags;
drop policy if exists post_tags_update_admin on public.post_tags;
drop policy if exists post_tags_delete_admin on public.post_tags;

create policy post_tags_select
  on public.post_tags for select
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_tags.post_id
        and (
          public.is_cms_admin()
          or public.post_is_public_readable(p.status, p.published_at, p.scheduled_at)
        )
    )
  );

create policy post_tags_insert_admin
  on public.post_tags for insert
  to authenticated
  with check (
    public.is_cms_admin()
    and exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id
    )
  );

create policy post_tags_update_admin
  on public.post_tags for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy post_tags_delete_admin
  on public.post_tags for delete
  to authenticated
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- RLS: blog_categories
-- ---------------------------------------------------------------------------
drop policy if exists blog_categories_select on public.blog_categories;
drop policy if exists blog_categories_insert_admin on public.blog_categories;
drop policy if exists blog_categories_update_admin on public.blog_categories;
drop policy if exists blog_categories_delete_admin on public.blog_categories;

create policy blog_categories_select
  on public.blog_categories for select
  using (
    public.is_cms_admin()
    or exists (
      select 1
      from public.posts p
      where p.category_id = blog_categories.id
        and p.web_id = blog_categories.web_id
        and public.post_is_public_readable(p.status, p.published_at, p.scheduled_at)
    )
  );

create policy blog_categories_insert_admin
  on public.blog_categories for insert
  to authenticated
  with check (public.is_cms_admin());

create policy blog_categories_update_admin
  on public.blog_categories for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy blog_categories_delete_admin
  on public.blog_categories for delete
  to authenticated
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- RLS: blog_tags
-- ---------------------------------------------------------------------------
drop policy if exists blog_tags_select on public.blog_tags;
drop policy if exists blog_tags_insert_admin on public.blog_tags;
drop policy if exists blog_tags_update_admin on public.blog_tags;
drop policy if exists blog_tags_delete_admin on public.blog_tags;

create policy blog_tags_select
  on public.blog_tags for select
  using (
    public.is_cms_admin()
    or exists (
      select 1
      from public.post_tags pt
      join public.posts p on p.id = pt.post_id
      where pt.tag_id = blog_tags.id
        and p.web_id = blog_tags.web_id
        and public.post_is_public_readable(p.status, p.published_at, p.scheduled_at)
    )
  );

create policy blog_tags_insert_admin
  on public.blog_tags for insert
  to authenticated
  with check (public.is_cms_admin());

create policy blog_tags_update_admin
  on public.blog_tags for update
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy blog_tags_delete_admin
  on public.blog_tags for delete
  to authenticated
  using (public.is_cms_admin());

commit;
