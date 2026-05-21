-- FK to property_packages; leads.services resolved from package_label at submit time.

alter table public.lead_submissions
  add column if not exists property_package_id uuid null
    references public.property_packages (id) on delete set null;

create index if not exists idx_lead_submissions_property_package_id
  on public.lead_submissions (property_package_id)
  where property_package_id is not null;

comment on column public.lead_submissions.property_package_id is
  'FK ke property_packages; leads.services di-resolve dari package_label baris ini.';

-- Best-effort backfill by exact label match (exclude generic contact-page label).
update public.lead_submissions ls
set property_package_id = pp.id
from public.property_packages pp
where ls.property_package_id is null
  and ls.web_id = pp.web_id
  and ls.package_label is not null
  and btrim(ls.package_label) = btrim(pp.package_label)
  and btrim(ls.package_label) <> 'Konsultasi umum — halaman kontak';
