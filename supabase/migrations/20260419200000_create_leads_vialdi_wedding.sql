-- leads_vialdi_wedding: wedding package card leads (2-step capture)

create table if not exists public.leads_vialdi_wedding (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  name text null,
  phone_number text null,
  email text null,
  package_label text not null default '',
  event_date date null,
  event_time text null,
  event_address text null,
  step integer not null default 0,
  source text not null default 'Wedding package card',
  lead_id uuid null,
  submitted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint leads_vialdi_wedding_pkey primary key (id),
  constraint leads_vialdi_wedding_organization_id_fkey foreign key (organization_id) references public.organizations (id),
  constraint leads_vialdi_wedding_lead_id_fkey foreign key (lead_id) references public.leads (id) on delete set null
);

create index if not exists idx_leads_vialdi_wedding_organization_id on public.leads_vialdi_wedding using btree (organization_id);
create index if not exists idx_leads_vialdi_wedding_lead_id on public.leads_vialdi_wedding using btree (lead_id);
create index if not exists idx_leads_vialdi_wedding_created_at on public.leads_vialdi_wedding using btree (created_at);

drop trigger if exists set_leads_vialdi_wedding_updated_at on public.leads_vialdi_wedding;
create trigger set_leads_vialdi_wedding_updated_at
before update on public.leads_vialdi_wedding
for each row execute function public.set_updated_at();
