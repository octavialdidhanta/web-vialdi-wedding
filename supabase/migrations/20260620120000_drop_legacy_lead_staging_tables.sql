-- Drop deprecated staging tables after hub backfill to lead_submissions.
-- Safe to re-run: backfill is idempotent; DROP IF EXISTS for tables.

-- Ensure legacy columns exist (from 20260620110000)
alter table public.lead_submissions
  add column if not exists legacy_table text null,
  add column if not exists legacy_id uuid null;

create unique index if not exists uq_lead_submissions_legacy
  on public.lead_submissions (legacy_table, legacy_id)
  where legacy_table is not null and legacy_id is not null;

-- Backfill wedding staging rows (skip if already imported)
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
where exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'leads_vialdi_wedding'
)
and not exists (
  select 1
  from public.lead_submissions ls
  where ls.legacy_table = 'leads_vialdi_wedding' and ls.legacy_id = w.id
);

-- Backfill vialdiid staging (agency site historical rows)
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
  'vialdi'::text,
  'contact-main'::text,
  1,
  case when v.submitted_at is not null then 2 else 1 end,
  case when v.submitted_at is not null then 'submitted' else 'draft' end,
  jsonb_strip_nulls(
    jsonb_build_object(
      'name', v.name,
      'phone_number', v.phone_number,
      'email', v.email,
      'industry', v.industry,
      'business_type', v.business_type,
      'job_title', v.job_title,
      'needs', v.needs,
      'office_address', v.office_address,
      'ringkasan_kebutuhan', v.ringkasan_kebutuhan
    )
  ),
  v.name,
  v.phone_number,
  v.email,
  nullif(btrim(v.package_label), ''),
  v.analytics_session_id,
  v.attribution,
  v.attribution_label,
  v.organization_id,
  v.lead_id,
  v.identity_hash,
  v.submitted_at,
  v.created_at,
  v.updated_at,
  'leads_vialdiid'::text,
  v.id
from public.leads_vialdiid v
where exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'leads_vialdiid'
)
and not exists (
  select 1
  from public.lead_submissions ls
  where ls.legacy_table = 'leads_vialdiid' and ls.legacy_id = v.id
);

drop table if exists public.leads_vialdi_wedding cascade;
drop table if exists public.leads_vialdiid cascade;
