-- Artikel published wajib punya published_at (tombol Publish di CMS).

update public.posts
set published_at = coalesce(updated_at, created_at, now())
where status = 'published'
  and published_at is null;

alter table public.posts
  drop constraint if exists posts_published_requires_published_at;

alter table public.posts
  add constraint posts_published_requires_published_at
  check (status <> 'published' or published_at is not null);
