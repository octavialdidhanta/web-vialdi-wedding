-- Enforce dedupe for CRM leads after cleanup.
-- Upsert-friendly uniqueness: ON CONFLICT (organization_id, dedupe_key)
-- NOTE: unique indexes treat NULLs as non-conflicting, so rows without session/funnel_key won't block each other.

create unique index if not exists uq_leads_dedupe_by_session_funnel
  on public.leads (organization_id, dedupe_key);

