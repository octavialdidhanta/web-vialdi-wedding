-- Security Advisor:
-- 1) "Multiple permissive policies" — gabung dua policy SELECT (publik + admin) jadi satu per tabel.
-- 2) "Auth RLS Initialization Plan" — untuk fcm_tokens (jika ada), pakai (select auth.uid()) agar initplan stabil.

-- ---------------------------------------------------------------------------
-- posts: satu policy SELECT (admin lihat semua OR publik lihat siap tayang)
-- ---------------------------------------------------------------------------

drop policy if exists "posts_select_public" on public.posts;
drop policy if exists "posts_select_admin" on public.posts;

create policy "posts_select"
  on public.posts for select
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    or (
      (
        status = 'published'
        and published_at is not null
        and published_at <= now()
      )
      or (
        status = 'scheduled'
        and scheduled_at is not null
        and scheduled_at <= now()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- post_tags: satu policy SELECT
-- ---------------------------------------------------------------------------

drop policy if exists "post_tags_select_public" on public.post_tags;
drop policy if exists "post_tags_select_admin" on public.post_tags;

create policy "post_tags_select"
  on public.post_tags for select
  using (
    exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
    or exists (
      select 1
      from public.posts p
      where p.id = post_tags.post_id
        and (
          (
            p.status = 'published'
            and p.published_at is not null
            and p.published_at <= now()
          )
          or (
            p.status = 'scheduled'
            and p.scheduled_at is not null
            and p.scheduled_at <= now()
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- wedding_packages: satu policy SELECT
-- ---------------------------------------------------------------------------

drop policy if exists "wedding_packages_select_public" on public.wedding_packages;
drop policy if exists "wedding_packages_select_admin" on public.wedding_packages;

create policy "wedding_packages_select"
  on public.wedding_packages for select
  using (
    is_published = true
    or exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- fcm_tokens: tabel mungkin dibuat di Studio / proyek lain — perbaiki initplan jika kolom user_id ada
-- ---------------------------------------------------------------------------

do $$
declare
  pol text;
begin
  if to_regclass('public.fcm_tokens') is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fcm_tokens'
      and column_name = 'user_id'
  ) then
    raise notice 'fcm_tokens ada tanpa kolom user_id — lewati policy otomatis; sesuaikan manual di SQL Editor.';
    return;
  end if;

  for pol in
    select p.polname::text
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on p.polrelid = c.oid
    join pg_catalog.pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public'
      and c.relname = 'fcm_tokens'
  loop
    execute format('drop policy if exists %I on public.fcm_tokens', pol);
  end loop;

  alter table public.fcm_tokens enable row level security;

  create policy "fcm_tokens_select_own"
    on public.fcm_tokens for select
    to authenticated
    using (user_id = (select auth.uid()));

  create policy "fcm_tokens_insert_own"
    on public.fcm_tokens for insert
    to authenticated
    with check (user_id = (select auth.uid()));

  create policy "fcm_tokens_update_own"
    on public.fcm_tokens for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

  create policy "fcm_tokens_delete_own"
    on public.fcm_tokens for delete
    to authenticated
    using (user_id = (select auth.uid()));
end;
$$;
