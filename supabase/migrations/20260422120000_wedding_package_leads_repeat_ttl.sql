-- Repeat order support for wedding package leads (TTL + identity-aware dedupe).
--
-- Goals:
-- - Allow multiple final submissions per analytics_session_id when identity (phone+email) changes.
-- - Keep step 1 "single draft per session" behavior unchanged.
-- - Preserve existing rows by backfilling identity hash.
--
-- Notes:
-- - We use SHA-256 via pgcrypto's digest(). gen_random_uuid() already implies pgcrypto is available.
-- - identity_hash is stored (not generated) so Edge Functions can set it deterministically too.

alter table public.leads_vialdi_wedding
  add column if not exists identity_hash text null;

-- Backfill identity_hash for existing rows (safe to run multiple times).
update public.leads_vialdi_wedding
set identity_hash = encode(
  digest(
    coalesce(phone_number, '') || '|' || lower(coalesce(email, '')),
    'sha256'
  ),
  'hex'
)
where identity_hash is null
  and (coalesce(phone_number, '') <> '' or coalesce(email, '') <> '');

-- Rebuild final_dedupe_key to include identity_hash so different identities can submit in same session.
drop index if exists public.uq_leads_vialdi_wedding_final_dedupe;

alter table public.leads_vialdi_wedding
  drop column if exists final_dedupe_key;

alter table public.leads_vialdi_wedding
  add column final_dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null
          and submitted_at is not null
          and identity_hash is not null
          and btrim(identity_hash) <> ''
        then analytics_session_id::text || ':' || identity_hash
        else null
      end
    ) stored;

create unique index if not exists uq_leads_vialdi_wedding_final_dedupe
  on public.leads_vialdi_wedding (organization_id, final_dedupe_key)
  where final_dedupe_key is not null;

