-- Dedupe for leads_vialdi_wedding:
-- - Ensure a single draft (step 1) row per (organization_id, analytics_session_id).
-- - Ensure a single final submission per (organization_id, analytics_session_id).
--
-- We use generated (stored) keys so the conflict target is a real column.
-- This avoids relying on partial-index inference and works well with upsert logic in Edge Functions.

alter table public.leads_vialdi_wedding
  add column if not exists step1_dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null and step = 1 then analytics_session_id::text
        else null
      end
    ) stored;

alter table public.leads_vialdi_wedding
  add column if not exists final_dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null and submitted_at is not null then analytics_session_id::text
        else null
      end
    ) stored;

-- One draft per session.
create unique index if not exists uq_leads_vialdi_wedding_step1_dedupe
  on public.leads_vialdi_wedding (organization_id, step1_dedupe_key)
  where step1_dedupe_key is not null;

-- One final per session.
create unique index if not exists uq_leads_vialdi_wedding_final_dedupe
  on public.leads_vialdi_wedding (organization_id, final_dedupe_key)
  where final_dedupe_key is not null;

