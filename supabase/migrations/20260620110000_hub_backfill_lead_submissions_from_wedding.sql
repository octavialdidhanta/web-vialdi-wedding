-- Backfill lead_submissions from deprecated leads_vialdi_wedding (idempotent).

alter table public.lead_submissions
  add column if not exists legacy_table text null,
  add column if not exists legacy_id uuid null;

create unique index if not exists uq_lead_submissions_legacy
  on public.lead_submissions (legacy_table, legacy_id)
  where legacy_table is not null and legacy_id is not null;

comment on column public.lead_submissions.legacy_table is 'Source table for migrated rows (e.g. leads_vialdi_wedding).';
comment on column public.lead_submissions.legacy_id is 'Primary key in legacy_table at migration time.';

insert into public.lead_submissions (
  web_id,
  form_id,
  form_version,
  step,
  status,
  form_data,
  name,
  phone_number,
  email,
  package_label,
  analytics_session_id,
  attribution,
  attribution_label,
  organization_id,
  lead_id,
  identity_hash,
  submitted_at,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
select
  'vialdi-wedding'::text,
  'contact-main'::text,
  1,
  case when w.submitted_at is not null then 2 else 1 end,
  case when w.submitted_at is not null then 'submitted' else 'draft' end,
  jsonb_strip_nulls(
    jsonb_build_object(
      'name', w.name,
      'phone_number', w.phone_number,
      'email', w.email,
      'event_date', w.event_date::text,
      'event_time', w.event_time,
      'event_address', w.event_address
    )
  ),
  w.name,
  w.phone_number,
  w.email,
  nullif(btrim(w.package_label), ''),
  w.analytics_session_id,
  w.attribution,
  w.attribution_label,
  w.organization_id,
  w.lead_id,
  w.identity_hash,
  w.submitted_at,
  w.created_at,
  w.updated_at,
  'leads_vialdi_wedding'::text,
  w.id
from public.leads_vialdi_wedding w
where not exists (
  select 1
  from public.lead_submissions ls
  where ls.legacy_table = 'leads_vialdi_wedding'
    and ls.legacy_id = w.id
);
