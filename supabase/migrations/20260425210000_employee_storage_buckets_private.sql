-- Security Advisor: "Public bucket allows listing" untuk employee-* masih muncul
-- selama kolom storage.buckets.public = true — Advisor menggabungkan status publik + policy SELECT.
--
-- Bucket internal (dokumen / profil karyawan) seharusnya tidak publik: tidak ada listing/URL anonim.
-- Akses file: user terautentikasi + policy SELECT yang sudah dibuat migrasi sebelumnya, atau signed URL.

update storage.buckets
set public = false
where id in ('employee-documents', 'employee-profiles');

-- Pastikan tidak ada policy SELECT "bebas" yang lolos (nama/ekspresi aneh). Ulangi pembersihan ringkas.
do $$
declare
  buckets text[] := array['employee-documents', 'employee-profiles'];
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
      qual_expr := coalesce(pg_catalog.pg_get_expr(pol.polqual, pol.polrelid), '');
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

-- Auth "Leaked password protection": hanya lewat Dashboard (Auth → Email / password security).
-- Fitur HIBP umumnya Pro+; di Free tier peringatan bisa tetap ada.
