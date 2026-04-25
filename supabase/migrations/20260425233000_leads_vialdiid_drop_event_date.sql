-- Form agensi tidak lagi mengumpulkan tanggal go-live; kolom dihapus dari `leads_vialdiid` saja.
-- `leads_vialdi_wedding` tetap memakai `event_date` untuk tanggal acara.

alter table public.leads_vialdiid
  drop column if exists event_date;
