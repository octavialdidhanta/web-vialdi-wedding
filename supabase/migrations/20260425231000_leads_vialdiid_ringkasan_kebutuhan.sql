-- Ringkasan kebutuhan (langkah akhir form konsultasi agensi) disimpan terpisah dari `event_address` (arsip gabungan / WA).

alter table public.leads_vialdiid
  add column if not exists ringkasan_kebutuhan text null;

comment on column public.leads_vialdiid.ringkasan_kebutuhan is
  'Ringkasan kebutuhan pemasaran dari form konsultasi agensi (langkah 3).';
