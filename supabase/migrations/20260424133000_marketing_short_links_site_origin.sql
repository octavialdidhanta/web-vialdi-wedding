-- Allow multi-domain short links (vialdi.id + jasafotowedding.com) in one Supabase project.
-- Each short link can optionally pin its redirect origin.

alter table public.marketing_short_links
  add column if not exists site_origin text null;

alter table public.marketing_short_links
  drop constraint if exists marketing_short_links_site_origin_shape;

alter table public.marketing_short_links
  add constraint marketing_short_links_site_origin_shape
    check (
      site_origin is null
      or (
        char_length(site_origin) between 8 and 200
        and site_origin ~* '^https?://'
      )
    );

create index if not exists marketing_short_links_site_origin_idx
  on public.marketing_short_links (site_origin);

