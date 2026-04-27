-- Drop legacy blog tables (replaced by agency_*).
-- Keep backwards-compatibility for old SQL/views by recreating `posts` and `post_tags` as views.

begin;

-- Remove tables
drop table if exists public.post_tags cascade;
drop table if exists public.posts cascade;

-- Backwards-compatible views (read-only)
create or replace view public.posts as
select
  id,
  slug,
  title,
  excerpt,
  status,
  featured,
  accent,
  cover_image_path,
  cover_image_url,
  body_json,
  body_html,
  toc_json,
  read_time_minutes,
  category_id,
  published_at,
  scheduled_at,
  created_at,
  updated_at,
  created_by,
  updated_by
from public.agency_posts;

create or replace view public.post_tags as
select
  post_id,
  tag_id
from public.agency_post_tags;

commit;

