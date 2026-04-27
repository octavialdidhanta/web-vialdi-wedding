-- Prevent cross-site data leaks: add `web_id` to posts and scope RLS to this web.

begin;

-- Column + backfill
alter table public.posts add column if not exists web_id text;
update public.posts set web_id = 'vialdi-wedding' where web_id is null;
alter table public.posts alter column web_id set not null;

-- Keep aligned with analytics web_id enum (this repo currently only allows vialdi-wedding).
alter table public.posts drop constraint if exists posts_web_id_check;
alter table public.posts
  add constraint posts_web_id_check
  check (web_id in ('vialdi-wedding', 'vialdi', 'synckerja'));

create index if not exists idx_posts_web_id_status_published
  on public.posts (web_id, status, published_at desc nulls last);

-- RLS: scope posts + post_tags by web_id
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;

drop policy if exists "agency_posts_select" on public.posts;
drop policy if exists "agency_posts_insert_admin" on public.posts;
drop policy if exists "agency_posts_update_admin" on public.posts;
drop policy if exists "agency_posts_delete_admin" on public.posts;

create policy "posts_select"
  on public.posts for select
  using (
    web_id = 'vialdi-wedding'
    and (
      exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
      or (
        (status = 'published' and published_at is not null and published_at <= now())
        or (status = 'scheduled' and scheduled_at is not null and scheduled_at <= now())
      )
    )
  );

create policy "posts_insert_admin"
  on public.posts for insert
  to authenticated
  with check (
    web_id = 'vialdi-wedding'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "posts_update_admin"
  on public.posts for update
  to authenticated
  using (
    web_id = 'vialdi-wedding'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  )
  with check (
    web_id = 'vialdi-wedding'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

create policy "posts_delete_admin"
  on public.posts for delete
  to authenticated
  using (
    web_id = 'vialdi-wedding'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "agency_post_tags_select" on public.post_tags;
drop policy if exists "agency_post_tags_insert_admin" on public.post_tags;
drop policy if exists "agency_post_tags_update_admin" on public.post_tags;
drop policy if exists "agency_post_tags_delete_admin" on public.post_tags;

create policy "post_tags_select"
  on public.post_tags for select
  using (
    exists (select 1 from public.posts p
      where p.id = post_tags.post_id
        and p.web_id = 'vialdi-wedding'
        and (
          exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
          or (
            (p.status = 'published' and p.published_at is not null and p.published_at <= now())
            or (p.status = 'scheduled' and p.scheduled_at is not null and p.scheduled_at <= now())
          )
        )
    )
  );

create policy "post_tags_insert_admin"
  on public.post_tags for insert
  to authenticated
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    and exists (select 1 from public.posts p where p.id = post_tags.post_id and p.web_id = 'vialdi-wedding')
  );

create policy "post_tags_update_admin"
  on public.post_tags for update
  to authenticated
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    and exists (select 1 from public.posts p where p.id = post_tags.post_id and p.web_id = 'vialdi-wedding')
  )
  with check (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    and exists (select 1 from public.posts p where p.id = post_tags.post_id and p.web_id = 'vialdi-wedding')
  );

create policy "post_tags_delete_admin"
  on public.post_tags for delete
  to authenticated
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    and exists (select 1 from public.posts p where p.id = post_tags.post_id and p.web_id = 'vialdi-wedding')
  );

commit;

