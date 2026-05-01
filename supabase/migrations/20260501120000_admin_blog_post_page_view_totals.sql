-- Total tampilan per path /blog/:slug (seluruh waktu), untuk kolom Visitor di admin posts.
-- Sumber: analytics_page_views (impression SPA; path tanpa query string).

create or replace function public.admin_blog_post_page_view_totals(p_web_id text)
returns table(path text, total_views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  return query
  select pv.path, count(*)::bigint as total_views
  from public.analytics_page_views pv
  where pv.web_id = p_web_id
    and pv.path ~ '^/blog/[^/]+$'
  group by pv.path;
end;
$$;

revoke all on function public.admin_blog_post_page_view_totals(text) from public;
grant execute on function public.admin_blog_post_page_view_totals(text) to authenticated;

comment on function public.admin_blog_post_page_view_totals(text) is
  'Agregat count analytics_page_views per path /blog/:slug (all-time), difilter web_id.';
