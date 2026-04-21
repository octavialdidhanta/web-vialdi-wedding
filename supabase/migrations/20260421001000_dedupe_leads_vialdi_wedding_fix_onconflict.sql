-- Fix: ON CONFLICT needs a matching unique index without a predicate.
-- The prior partial unique indexes (WHERE key is not null) are not eligible for ON CONFLICT(column_list).
-- Using a non-partial unique index is safe because NULLs do not conflict with each other in Postgres.

drop index if exists public.uq_leads_vialdi_wedding_step1_dedupe;
drop index if exists public.uq_leads_vialdi_wedding_final_dedupe;

create unique index if not exists uq_leads_vialdi_wedding_step1_dedupe
  on public.leads_vialdi_wedding (organization_id, step1_dedupe_key);

create unique index if not exists uq_leads_vialdi_wedding_final_dedupe
  on public.leads_vialdi_wedding (organization_id, final_dedupe_key);

