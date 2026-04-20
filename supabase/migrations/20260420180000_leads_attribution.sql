-- Marketing attribution for CRM leads (UTM + landing path + referrer).
-- Populated by Edge Functions from client payload; `attribution_label` is server-derived.

alter table public.leads
  add column if not exists attribution jsonb null,
  add column if not exists attribution_label text null;

comment on column public.leads.attribution is
  'JSON: landing_url, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term (sparse; client snapshot).';
comment on column public.leads.attribution_label is
  'Short human-readable summary computed server-side from attribution.';

alter table public.leads_vialdi_wedding
  add column if not exists attribution jsonb null,
  add column if not exists attribution_label text null;

comment on column public.leads_vialdi_wedding.attribution is
  'Same shape as public.leads.attribution; wedding package / contact page funnel.';
comment on column public.leads_vialdi_wedding.attribution_label is
  'Same as public.leads.attribution_label.';

alter table public.leads_vialdiid
  add column if not exists attribution jsonb null,
  add column if not exists attribution_label text null;

comment on column public.leads_vialdiid.attribution is
  'Same shape as public.leads.attribution; Vialdi.ID contact form funnel.';
comment on column public.leads_vialdiid.attribution_label is
  'Same as public.leads.attribution_label.';
