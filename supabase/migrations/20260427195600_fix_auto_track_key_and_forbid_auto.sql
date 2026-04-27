-- Fix existing legacy "auto:*" track_key values and then forbid them going forward.
-- Uses NOT VALID to avoid failing before backfill completes.

begin;

-- 1) Backfill/convert existing legacy values like "auto:button:video_sinematik" -> "video_sinematik_cta"
update public.analytics_click_events
set track_key =
  left(
    regexp_replace(track_key, '^auto:(a|button|input|unknown):', '', 'i')
    || '_' ||
    case
      when track_key ~* '^auto:a:' then 'link'
      when track_key ~* '^auto:(button|input):' then 'cta'
      else 'click'
    end,
    80
  )
where track_key ~* '^auto:';

-- 2) Forbid "auto:" prefix going forward (after backfill).
alter table public.analytics_click_events
  drop constraint if exists analytics_click_events_track_key_no_auto;
alter table public.analytics_click_events
  add constraint analytics_click_events_track_key_no_auto
  check (track_key !~ '^auto:') not valid;

alter table public.analytics_click_events
  validate constraint analytics_click_events_track_key_no_auto;

commit;

