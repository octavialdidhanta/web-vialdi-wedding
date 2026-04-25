-- Align `public.leads_vialdiid` with the 2-step package capture shape used by `leads_vialdi_wedding`
-- (package_label + event_* fields + session dedupe + identity-aware final dedupe).
--
-- Existing columns (industry, business_type, job_title, needs, office_address, …) are kept.

alter table public.leads_vialdiid
  add column if not exists package_label text not null default ''::text,
  add column if not exists event_date date null,
  add column if not exists event_time text null,
  add column if not exists event_address text null,
  add column if not exists identity_hash text null;

-- Backfill identity_hash for existing rows (safe to run multiple times).
update public.leads_vialdiid
set identity_hash = encode(
  digest(
    coalesce(phone_number, '') || '|' || lower(coalesce(email, '')),
    'sha256'
  ),
  'hex'
)
where identity_hash is null
  and (coalesce(phone_number, '') <> '' or coalesce(email, '') <> '');

-- Generated dedupe keys (match wedding table semantics).
alter table public.leads_vialdiid
  add column if not exists step1_dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null and step = 1 then analytics_session_id::text
        else null::text
      end
    ) stored;

alter table public.leads_vialdiid
  add column if not exists final_dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null
          and submitted_at is not null
          and identity_hash is not null
          and btrim(identity_hash) <> ''::text
        then analytics_session_id::text || ':'::text || identity_hash
        else null::text
      end
    ) stored;

-- Best-effort cleanup: if duplicates already exist for the same draft session key,
-- keep the newest row and detach/delete obvious throwaway drafts.
with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id, step1_dedupe_key
      order by updated_at desc, created_at desc
    ) as rn
  from public.leads_vialdiid
  where step1_dedupe_key is not null
),
losers as (
  select id
  from ranked
  where rn > 1
)
delete from public.leads_vialdiid v
using losers l
where v.id = l.id
  and v.step = 1
  and v.submitted_at is null
  and v.lead_id is null;

-- Best-effort cleanup for impossible duplicate finals (should be rare).
with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id, final_dedupe_key
      order by submitted_at desc nulls last, updated_at desc, created_at desc
    ) as rn
  from public.leads_vialdiid
  where final_dedupe_key is not null
),
losers as (
  select id
  from ranked
  where rn > 1
)
delete from public.leads_vialdiid v
using losers l
where v.id = l.id;

-- Unique indexes must be eligible for PostgREST upsert `on_conflict=organization_id,step1_dedupe_key`
-- (non-partial unique btree index; NULL step1 keys won't conflict with each other).
create unique index if not exists uq_leads_vialdiid_step1_dedupe
  on public.leads_vialdiid (organization_id, step1_dedupe_key);

create unique index if not exists uq_leads_vialdiid_final_dedupe
  on public.leads_vialdiid (organization_id, final_dedupe_key);

drop trigger if exists set_leads_vialdiid_updated_at on public.leads_vialdiid;
create trigger set_leads_vialdiid_updated_at
before update on public.leads_vialdiid
for each row execute function public.set_updated_at();

comment on column public.leads_vialdiid.package_label is 'Marketing/agency package label captured from the package card consult funnel.';
comment on column public.leads_vialdiid.event_date is 'Step-2 field (reused column name): e.g. desired campaign start date for agency consult.';
comment on column public.leads_vialdiid.event_time is 'Step-2 field (reused column name): e.g. preferred contact time window.';
comment on column public.leads_vialdiid.event_address is 'Step-2 field (reused column name): free text (goals/brief/notes).';
