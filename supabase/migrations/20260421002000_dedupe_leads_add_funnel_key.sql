-- Dedupe for CRM leads (`public.leads`) without collapsing distinct funnels.
-- Strategy:
-- - Add `web_id` + `funnel_key` as stable funnel identity.
-- - Add generated `dedupe_key` = analytics_session_id + funnel_key.
-- - Uniqueness is enforced in a later migration after cleanup.

alter table public.leads
  add column if not exists web_id text null,
  add column if not exists funnel_key text null;

-- Backfill web_id from analytics_sessions when available.
update public.leads l
set web_id = s.web_id
from public.analytics_sessions s
where l.web_id is null
  and l.analytics_session_id is not null
  and s.id = l.analytics_session_id;

-- Backfill funnel_key for existing rows using a conservative mapping.
-- For unknown categories, we bucket into a legacy namespace to avoid over-deduping across funnels.
update public.leads
set funnel_key = (
  case
    when category = 'Wedding package card' then 'wedding-package-lead:' || coalesce(web_id, 'unknown') || ':package'
    when category = 'Contact Form' then 'contact-lead:' || coalesce(web_id, 'unknown') || ':contact'
    else 'legacy:' || coalesce(web_id, 'unknown') || ':' ||
      left(regexp_replace(lower(coalesce(category, 'unknown')), '[^a-z0-9]+', '-', 'g'), 80)
  end
)
where funnel_key is null;

alter table public.leads
  add column if not exists dedupe_key text
    generated always as (
      case
        when analytics_session_id is not null
          and funnel_key is not null
          and btrim(funnel_key) <> ''
        then analytics_session_id::text || ':' || funnel_key
        else null
      end
    ) stored;

create index if not exists idx_leads_funnel_key
  on public.leads (funnel_key);

create index if not exists idx_leads_web_id
  on public.leads (web_id);

