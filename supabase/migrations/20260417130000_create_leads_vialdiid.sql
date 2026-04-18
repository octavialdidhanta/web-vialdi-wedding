-- leads_vialdiid: landing-page leads captured in steps

create table if not exists public.leads_vialdiid (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  name text null,
  phone_number text null,
  email text null,
  industry text null,
  business_type text null,
  job_title text null,
  needs text null,
  office_address text null,
  step integer not null default 0,
  source text not null default 'Website',
  lead_id uuid null,
  submitted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint leads_vialdiid_pkey primary key (id),
  constraint leads_vialdiid_organization_id_fkey foreign key (organization_id) references public.organizations (id),
  constraint leads_vialdiid_lead_id_fkey foreign key (lead_id) references public.leads (id) on delete set null
);

create index if not exists idx_leads_vialdiid_organization_id on public.leads_vialdiid using btree (organization_id);
create index if not exists idx_leads_vialdiid_lead_id on public.leads_vialdiid using btree (lead_id);
create index if not exists idx_leads_vialdiid_created_at on public.leads_vialdiid using btree (created_at);

-- Generic updated_at trigger (only if your project doesn't already have one)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_vialdiid_updated_at on public.leads_vialdiid;
create trigger set_leads_vialdiid_updated_at
before update on public.leads_vialdiid
for each row execute function public.set_updated_at();

