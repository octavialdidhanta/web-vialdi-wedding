-- Profile columns on lead_submissions (replaces direct edge writes to lead_client_profiles).
-- Bridge trigger keeps lead_client_profiles in sync for external CRM until sunset.

-- ---------------------------------------------------------------------------
-- 1.1 New columns on lead_submissions
-- ---------------------------------------------------------------------------
alter table public.lead_submissions
  add column if not exists gender text null,
  add column if not exists age integer null,
  add column if not exists occupation text null,
  add column if not exists location text null,
  add column if not exists code text null,
  add column if not exists industry text null,
  add column if not exists notes text null,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid null;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_gender_check;

alter table public.lead_submissions
  add constraint lead_submissions_gender_check
  check (gender is null or gender in ('Male', 'Female', 'Other'));

alter table public.lead_submissions
  drop constraint if exists lead_submissions_age_check;

alter table public.lead_submissions
  add constraint lead_submissions_age_check
  check (age is null or (age >= 1 and age <= 149));

comment on column public.lead_submissions.occupation is
  'Client occupation (pekerjaan). Wedding event date/time stay in form_data and notes.';
comment on column public.lead_submissions.notes is
  'Client profile notes (e.g. wedding package, date, address block).';

-- ---------------------------------------------------------------------------
-- 1.2 Backfill from lead_client_profiles → canonical submission per lead_id
-- QA: SELECT count(*) FROM lead_client_profiles p
--       WHERE NOT EXISTS (SELECT 1 FROM lead_submissions ls WHERE ls.lead_id = p.lead_id);
-- ---------------------------------------------------------------------------
with pick as (
  select distinct on (p.lead_id)
    p.lead_id,
    p.gender,
    p.age,
    p.occupation,
    p.location,
    p.code,
    p.industry,
    p.notes,
    p.is_active,
    p.created_by
  from public.lead_client_profiles p
  order by p.lead_id, p.updated_at desc nulls last
),
target as (
  select distinct on (ls.lead_id)
    ls.id as submission_id,
    ls.lead_id
  from public.lead_submissions ls
  where ls.lead_id is not null
  order by
    ls.lead_id,
    (ls.status = 'submitted') desc,
    ls.updated_at desc nulls last,
    ls.created_at desc
)
update public.lead_submissions ls
set
  gender = coalesce(ls.gender, pick.gender),
  age = coalesce(ls.age, pick.age),
  occupation = coalesce(ls.occupation, pick.occupation),
  location = coalesce(ls.location, pick.location),
  code = coalesce(ls.code, pick.code),
  industry = coalesce(ls.industry, pick.industry),
  notes = coalesce(ls.notes, pick.notes),
  is_active = coalesce(ls.is_active, pick.is_active),
  created_by = coalesce(ls.created_by, pick.created_by)
from target t
join pick on pick.lead_id = t.lead_id
where ls.id = t.submission_id;

-- ---------------------------------------------------------------------------
-- 1.3 Unique lead_id on lead_client_profiles (when no duplicates)
-- ---------------------------------------------------------------------------
do $$
declare
  dup_count int;
begin
  select count(*)::int into dup_count
  from (
    select lead_id
    from public.lead_client_profiles
    group by lead_id
    having count(*) > 1
  ) d;

  if dup_count = 0 then
    create unique index if not exists uq_lead_client_profiles_lead_id
      on public.lead_client_profiles (lead_id);
  else
    raise notice
      'Skipping uq_lead_client_profiles_lead_id: % lead_id(s) have duplicate profile rows',
      dup_count;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1.4 Bridge: lead_submissions → lead_client_profiles (external CRM compat)
-- ---------------------------------------------------------------------------
create or replace function public.bridge_lead_submission_to_client_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_created_by uuid;
begin
  if new.lead_id is null then
    return new;
  end if;

  v_name := coalesce(nullif(btrim(new.name), ''), '—');

  select p.created_by into v_created_by
  from public.lead_client_profiles p
  where p.lead_id = new.lead_id
  order by p.updated_at desc nulls last
  limit 1;

  v_created_by := coalesce(new.created_by, v_created_by);

  if v_created_by is null then
    return new;
  end if;

  update public.lead_client_profiles p
  set
    name = v_name,
    gender = new.gender,
    age = new.age,
    occupation = new.occupation,
    location = new.location,
    code = new.code,
    contact_person = nullif(btrim(new.name), ''),
    contact_email = new.email,
    contact_phone = new.phone_number,
    industry = new.industry,
    notes = new.notes,
    is_active = coalesce(new.is_active, true),
    phone_number = new.phone_number,
    email = new.email,
    updated_at = now()
  where p.lead_id = new.lead_id;

  if not found then
    insert into public.lead_client_profiles (
      lead_id,
      name,
      gender,
      age,
      occupation,
      location,
      organization_id,
      code,
      contact_person,
      contact_email,
      contact_phone,
      industry,
      notes,
      is_active,
      phone_number,
      email,
      created_by
    ) values (
      new.lead_id,
      v_name,
      new.gender,
      new.age,
      new.occupation,
      new.location,
      new.organization_id,
      new.code,
      nullif(btrim(new.name), ''),
      new.email,
      new.phone_number,
      new.industry,
      new.notes,
      coalesce(new.is_active, true),
      new.phone_number,
      new.email,
      v_created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bridge_lead_submission_to_client_profile on public.lead_submissions;

create trigger trg_bridge_lead_submission_to_client_profile
  after insert or update of
    lead_id,
    name,
    email,
    phone_number,
    gender,
    age,
    occupation,
    location,
    code,
    industry,
    notes,
    is_active,
    created_by
  on public.lead_submissions
  for each row
  execute function public.bridge_lead_submission_to_client_profile();

comment on function public.bridge_lead_submission_to_client_profile is
  'Mirrors hub submission contact/profile fields to lead_client_profiles until external CRM migrates off that table.';
