-- Security Advisor: "Public bucket allows listing" masih muncul jika:
--   - migrasi sebelumnya memakai nama bucket salah (sniping vs shipping), atau
--   - pg_policies.qual tidak cocok dengan LIKE (format cast berbeda).
-- Migrasi ini memakai pg_catalog.pg_policy + pg_get_expr agar semua policy SELECT
-- yang USING-nya menyebut bucket tersebut ter-drop, lalu diganti satu policy ketat.

-- Hapus policy salah nama dari migrasi lama (jika pernah terbuat).
drop policy if exists "sniping_images_select_authenticated" on storage.objects;

do $$
declare
  buckets text[] := array[
    'employee-documents',
    'employee-profiles',
    'shipping-images'
  ];
  b text;
  pol record;
  pol_name text;
  qual_expr text;
begin
  FOREACH b IN ARRAY buckets
  loop
    if not exists (select 1 from storage.buckets sb where sb.id = b) then
      continue;
    end if;

    for pol in
      select
        p.polname::text as polname,
        p.polqual,
        p.polrelid
      from pg_catalog.pg_policy p
      join pg_catalog.pg_class c on p.polrelid = c.oid
      join pg_catalog.pg_namespace n on c.relnamespace = n.oid
      where n.nspname = 'storage'
        and c.relname = 'objects'
        and p.polcmd = 'r'::"char"
    loop
      qual_expr := coalesce(
        pg_catalog.pg_get_expr(pol.polqual, pol.polrelid),
        ''
      );
      if qual_expr ilike '%' || b || '%' then
        execute format('drop policy if exists %I on storage.objects', pol.polname);
      end if;
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

-- ---------------------------------------------------------------------------
-- Leaked password protection (Auth): tidak bisa di-SQL di hosted Supabase.
-- Dashboard → Authentication → Providers → Email → aktifkan "Prevent use of leaked passwords".
-- Catatan docs Supabase: fitur HIBP tersedia pada plan Pro ke atas — di Free tier
-- peringatan Advisor bisa tetap muncul sampai upgrade atau abaikan jika tidak pakai password.
-- ---------------------------------------------------------------------------
