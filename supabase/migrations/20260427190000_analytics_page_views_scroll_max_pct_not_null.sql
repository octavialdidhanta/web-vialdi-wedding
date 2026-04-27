begin;

-- Backfill existing rows so we can enforce NOT NULL.
update public.analytics_page_views
set scroll_max_pct = 0
where scroll_max_pct is null;

-- Ensure future inserts always have a value.
alter table public.analytics_page_views
  alter column scroll_max_pct set default 0;

-- Enforce non-null.
alter table public.analytics_page_views
  alter column scroll_max_pct set not null;

-- Guardrail: keep values in a sane range.
alter table public.analytics_page_views
  drop constraint if exists analytics_page_views_scroll_max_pct_range;
alter table public.analytics_page_views
  add constraint analytics_page_views_scroll_max_pct_range
  check (scroll_max_pct >= 0 and scroll_max_pct <= 100);

commit;
