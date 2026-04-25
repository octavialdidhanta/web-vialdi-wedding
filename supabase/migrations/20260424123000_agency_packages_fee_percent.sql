-- Add management fee percent for agency packages (Paket Ads).

alter table public.agency_packages
  add column if not exists fee_percent numeric not null default 10;

create index if not exists idx_agency_packages_fee_percent
  on public.agency_packages (fee_percent);

