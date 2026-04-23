-- Security Advisor: "RLS disabled in public" untuk tabel lead.
--
-- Situs tetap jalan: form memanggil Edge Function `contact-lead` / `wedding-package-lead`
-- yang memakai Supabase client dengan SERVICE ROLE KEY — role ini melewati RLS.
-- Browser hanya memakai anon key ke fungsi HTTP, bukan INSERT langsung ke tabel ini.
--
-- Tanpa policy untuk anon/authenticated = akses lewat PostgREST ditolak (default deny),
-- yang mengurangi risiko eksploitasi jika kunci anon bocor.

alter table if exists public.leads_vialdiid enable row level security;
alter table if exists public.leads_vialdi_wedding enable row level security;
