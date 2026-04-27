-- Enforce non-null, consistent track_key for click events.
-- Backfill historical rows with a deterministic fallback before tightening constraints.

begin;

-- 1) Backfill: ensure every row has a track_key
update public.analytics_click_events
set track_key =
  -- Prefer existing label-like value when present; otherwise synthesize from element_type + label.
  left(
    coalesce(nullif(trim(track_key), ''), 'auto:' || element_type || ':' || regexp_replace(lower(coalesce(nullif(trim(element_label), ''), 'unknown')), '[^a-z0-9]+', '_', 'g')),
    80
  )
where track_key is null or trim(track_key) = '';

-- 2) Tighten column
alter table public.analytics_click_events
  alter column track_key set not null;

-- 3) Basic consistency: non-empty, safe charset, and length <= 80 (aligned with Edge clip)
alter table public.analytics_click_events
  drop constraint if exists analytics_click_events_track_key_format;
alter table public.analytics_click_events
  add constraint analytics_click_events_track_key_format
  check (
    length(track_key) between 1 and 80
    and track_key ~ '^[a-z0-9][a-z0-9_:\\-]*$'
  );

-- 4) Optional: speed up per-track_key rollups
create index if not exists idx_analytics_clicks_web_track_key_created
  on public.analytics_click_events (web_id, track_key, created_at desc);

commit;

