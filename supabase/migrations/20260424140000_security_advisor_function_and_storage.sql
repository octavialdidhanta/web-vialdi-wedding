-- Security Advisor (Supabase):
-- 1) Function search_path mutable → set search_path on public.set_updated_at
-- 2) Public bucket allows listing → drop permissive SELECT on storage.objects; replace with
--    authenticated CMS-only where applicable; public HTTP GET to .../object/public/... tetap
--    untuk bucket public=true (tanpa policy SELECT anon untuk list).
-- 3) Leaked password: tidak bisa di-SQL — aktifkan di Dashboard → Authentication → Policies
--    (atau Email provider) → "Leaked password protection" / HaveIBeenPwned.

-- ---------------------------------------------------------------------------
-- 1) Trigger function: immutable search_path
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Storage: blog-media — hilangkan SELECT anon (listing); admin CMS tetap bisa list
-- ---------------------------------------------------------------------------

drop policy if exists "blog_media_public_read" on storage.objects;

drop policy if exists "blog_media_select_cms_admin" on storage.objects;
create policy "blog_media_select_cms_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 3) Storage: package-media — pola sama
-- ---------------------------------------------------------------------------

drop policy if exists "package_media_public_read" on storage.objects;

drop policy if exists "package_media_select_cms_admin" on storage.objects;
create policy "package_media_select_cms_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'package-media'
    and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 4) Bucket lain di project (employee-*, shipping-images): drop SELECT yang terlalu luas,
--    lalu SELECT hanya untuk authenticated (sesuaikan RLS di bawah jika perlu aturan per-user).
-- ---------------------------------------------------------------------------

do $$
declare
  buckets text[] := array[
    'employee-documents',
    'employee-profiles',
    'shipping-images'
  ];
  b text;
  r record;
  pol_name text;
begin
  FOREACH b IN ARRAY buckets
  loop
    if not exists (select 1 from storage.buckets sb where sb.id = b) then
      continue;
    end if;

    for r in
      select p.policyname
      from pg_policies p
      where p.schemaname = 'storage'
        and p.tablename = 'objects'
        and p.cmd = 'SELECT'
        and p.qual is not null
        and p.qual like '%' || b || '%'
    loop
      execute format('drop policy if exists %I on storage.objects', r.policyname);
    end loop;

    pol_name := replace(b, '-', '_') || '_select_authenticated';
    execute format('drop policy if exists %I on storage.objects', pol_name);
    execute format(
      'create policy %I on storage.objects for select to authenticated using (bucket_id = %L)',
      pol_name,
      b
    );
  end loop;
end;
$$;
