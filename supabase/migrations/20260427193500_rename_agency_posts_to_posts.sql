-- Rename agency_* blog tables to legacy names:
-- - agency_posts      -> posts
-- - agency_post_tags  -> post_tags
-- Note: we previously created `posts`/`post_tags` as VIEWs for compatibility; drop them first.

begin;

-- Drop compatibility views (if present)
drop view if exists public.post_tags;
drop view if exists public.posts;

-- Rename base tables
alter table if exists public.agency_posts rename to posts;
alter table if exists public.agency_post_tags rename to post_tags;

-- Fix FK on renamed join table (Postgres does not auto-update referenced table names in constraint definition)
do $$
declare
  fk_name text;
begin
  select con.conname
    into fk_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where con.contype = 'f'
    and nsp.nspname = 'public'
    and rel.relname = 'post_tags'
    and con.conname like '%post_id%';

  if fk_name is not null then
    execute format('alter table public.post_tags drop constraint %I', fk_name);
  end if;

  alter table public.post_tags
    add constraint post_tags_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade;
end $$;

commit;

