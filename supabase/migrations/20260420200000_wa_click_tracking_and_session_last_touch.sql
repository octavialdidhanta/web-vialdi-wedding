-- WA click tracking + link to CRM leads + last-touch attribution on analytics_sessions.
--
-- Goals:
-- - Persist explicit WA click events (server-side) for reliable attribution + owner notifications.
-- - Store analytics session id on CRM leads to join WA clicks → leads.
-- - Keep both first-touch and last-touch attribution in analytics_sessions.

-- ---------------------------------------------------------------------------
-- Table: analytics_wa_clicks
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_wa_clicks (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  web_id text not null,
  session_id uuid not null references public.analytics_sessions (id) on delete cascade,
  path text not null,
  target_url text null,
  attribution jsonb null,
  ua_hash text null,
  ip_hash text null
);

comment on table public.analytics_wa_clicks is 'Server-side events when user clicks Floating WhatsApp (reliable trigger for owner notification + attribution join via session_id).';
comment on column public.analytics_wa_clicks.attribution is 'Landing snapshot: landing_url/referrer/utm/meta/click-id flags; sparse JSON.';
comment on column public.analytics_wa_clicks.ip_hash is 'Privacy-friendly hash of x-forwarded-for (optional).';

create index if not exists idx_analytics_wa_clicks_web_created
  on public.analytics_wa_clicks (web_id, created_at desc);
create index if not exists idx_analytics_wa_clicks_session
  on public.analytics_wa_clicks (session_id, created_at desc);

alter table public.analytics_wa_clicks enable row level security;

drop policy if exists "analytics_wa_clicks_select_admin" on public.analytics_wa_clicks;
create policy "analytics_wa_clicks_select_admin"
  on public.analytics_wa_clicks for select
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

revoke all on public.analytics_wa_clicks from public;
grant select on public.analytics_wa_clicks to authenticated;

-- ---------------------------------------------------------------------------
-- Link analytics session → CRM lead tables
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists analytics_session_id uuid null;

alter table public.leads_vialdi_wedding
  add column if not exists analytics_session_id uuid null;

alter table public.leads_vialdiid
  add column if not exists analytics_session_id uuid null;

create index if not exists idx_leads_analytics_session_id
  on public.leads (analytics_session_id)
  where analytics_session_id is not null;

create index if not exists idx_leads_vialdi_wedding_analytics_session_id
  on public.leads_vialdi_wedding (analytics_session_id)
  where analytics_session_id is not null;

create index if not exists idx_leads_vialdiid_analytics_session_id
  on public.leads_vialdiid (analytics_session_id)
  where analytics_session_id is not null;

comment on column public.leads.analytics_session_id is 'Anonymous analytics session id captured on lead submit; joins to analytics_* tables.';
comment on column public.leads_vialdi_wedding.analytics_session_id is 'Anonymous analytics session id captured on lead submit; joins to analytics_* tables.';
comment on column public.leads_vialdiid.analytics_session_id is 'Anonymous analytics session id captured on lead submit; joins to analytics_* tables.';

-- ---------------------------------------------------------------------------
-- analytics_sessions: first-touch + last-touch
-- ---------------------------------------------------------------------------

alter table public.analytics_sessions
  add column if not exists first_landing_url text null,
  add column if not exists first_referrer text null,
  add column if not exists first_utm_source text null,
  add column if not exists first_utm_medium text null,
  add column if not exists first_utm_campaign text null,
  add column if not exists first_utm_content text null,
  add column if not exists first_utm_term text null,
  add column if not exists first_meta_campaign_name text null,
  add column if not exists first_meta_adset_name text null,
  add column if not exists first_meta_ad_name text null,
  add column if not exists first_has_gclid boolean not null default false,
  add column if not exists first_has_fbclid boolean not null default false,
  add column if not exists first_has_msclkid boolean not null default false,
  add column if not exists first_has_gbraid boolean not null default false,
  add column if not exists first_has_wbraid boolean not null default false,
  add column if not exists last_landing_url text null,
  add column if not exists last_referrer text null,
  add column if not exists last_utm_source text null,
  add column if not exists last_utm_medium text null,
  add column if not exists last_utm_campaign text null,
  add column if not exists last_utm_content text null,
  add column if not exists last_utm_term text null,
  add column if not exists last_meta_campaign_name text null,
  add column if not exists last_meta_adset_name text null,
  add column if not exists last_meta_ad_name text null,
  add column if not exists last_has_gclid boolean not null default false,
  add column if not exists last_has_fbclid boolean not null default false,
  add column if not exists last_has_msclkid boolean not null default false,
  add column if not exists last_has_gbraid boolean not null default false,
  add column if not exists last_has_wbraid boolean not null default false;

comment on column public.analytics_sessions.first_landing_url is 'First-touch landing URL for this session id.';
comment on column public.analytics_sessions.last_landing_url is 'Last-touch landing URL seen for this session id (updates when new UTM/click-id arrives).';

-- ---------------------------------------------------------------------------
-- RPC: analytics_session_touch (keep same signature; extend behavior)
-- ---------------------------------------------------------------------------

revoke execute on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
) from service_role;

create or replace function public.analytics_session_touch(
  p_session uuid,
  p_web_id text,
  p_referrer text,
  p_ua_hash text,
  p_auth uuid default null,
  p_landing_url text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null,
  p_meta_campaign_name text default null,
  p_meta_adset_name text default null,
  p_meta_ad_name text default null,
  p_has_gclid boolean default false,
  p_has_fbclid boolean default false,
  p_has_msclkid boolean default false,
  p_has_gbraid boolean default false,
  p_has_wbraid boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
begin
  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  insert into public.analytics_sessions (
    id, web_id, referrer, ua_hash, auth_user_id,
    landing_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    meta_campaign_name, meta_adset_name, meta_ad_name,
    has_gclid, has_fbclid, has_msclkid, has_gbraid, has_wbraid,

    first_landing_url, first_referrer,
    first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term,
    first_meta_campaign_name, first_meta_adset_name, first_meta_ad_name,
    first_has_gclid, first_has_fbclid, first_has_msclkid, first_has_gbraid, first_has_wbraid,

    last_landing_url, last_referrer,
    last_utm_source, last_utm_medium, last_utm_campaign, last_utm_content, last_utm_term,
    last_meta_campaign_name, last_meta_adset_name, last_meta_ad_name,
    last_has_gclid, last_has_fbclid, last_has_msclkid, last_has_gbraid, last_has_wbraid
  )
  values (
    p_session,
    p_web_id,
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_ua_hash), ''), 64),
    p_auth,
    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false),

    -- first-touch (immutable once set)
    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false),

    -- last-touch (updates)
    left(nullif(trim(p_landing_url), ''), 1000),
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_utm_source), ''), 200),
    left(nullif(trim(p_utm_medium), ''), 200),
    left(nullif(trim(p_utm_campaign), ''), 200),
    left(nullif(trim(p_utm_content), ''), 200),
    left(nullif(trim(p_utm_term), ''), 200),
    left(nullif(trim(p_meta_campaign_name), ''), 200),
    left(nullif(trim(p_meta_adset_name), ''), 200),
    left(nullif(trim(p_meta_ad_name), ''), 200),
    coalesce(p_has_gclid, false),
    coalesce(p_has_fbclid, false),
    coalesce(p_has_msclkid, false),
    coalesce(p_has_gbraid, false),
    coalesce(p_has_wbraid, false)
  )
  on conflict (id) do update set
    last_seen_at = now(),
    web_id = excluded.web_id,
    referrer = coalesce(excluded.referrer, public.analytics_sessions.referrer),
    ua_hash = coalesce(excluded.ua_hash, public.analytics_sessions.ua_hash),
    auth_user_id = coalesce(excluded.auth_user_id, public.analytics_sessions.auth_user_id),

    -- Backward-compat columns: keep first non-empty (existing behavior)
    landing_url = coalesce(
      nullif(btrim(public.analytics_sessions.landing_url), ''),
      nullif(btrim(excluded.landing_url), '')
    ),
    utm_source = coalesce(
      nullif(btrim(public.analytics_sessions.utm_source), ''),
      nullif(btrim(excluded.utm_source), '')
    ),
    utm_medium = coalesce(
      nullif(btrim(public.analytics_sessions.utm_medium), ''),
      nullif(btrim(excluded.utm_medium), '')
    ),
    utm_campaign = coalesce(
      nullif(btrim(public.analytics_sessions.utm_campaign), ''),
      nullif(btrim(excluded.utm_campaign), '')
    ),
    utm_content = coalesce(
      nullif(btrim(public.analytics_sessions.utm_content), ''),
      nullif(btrim(excluded.utm_content), '')
    ),
    utm_term = coalesce(
      nullif(btrim(public.analytics_sessions.utm_term), ''),
      nullif(btrim(excluded.utm_term), '')
    ),
    meta_campaign_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_campaign_name), ''),
      nullif(btrim(excluded.meta_campaign_name), '')
    ),
    meta_adset_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_adset_name), ''),
      nullif(btrim(excluded.meta_adset_name), '')
    ),
    meta_ad_name = coalesce(
      nullif(btrim(public.analytics_sessions.meta_ad_name), ''),
      nullif(btrim(excluded.meta_ad_name), '')
    ),
    has_gclid = public.analytics_sessions.has_gclid or excluded.has_gclid,
    has_fbclid = public.analytics_sessions.has_fbclid or excluded.has_fbclid,
    has_msclkid = public.analytics_sessions.has_msclkid or excluded.has_msclkid,
    has_gbraid = public.analytics_sessions.has_gbraid or excluded.has_gbraid,
    has_wbraid = public.analytics_sessions.has_wbraid or excluded.has_wbraid,

    -- First-touch: fill only if currently empty.
    first_landing_url = coalesce(
      nullif(btrim(public.analytics_sessions.first_landing_url), ''),
      nullif(btrim(excluded.first_landing_url), '')
    ),
    first_referrer = coalesce(
      nullif(btrim(public.analytics_sessions.first_referrer), ''),
      nullif(btrim(excluded.first_referrer), '')
    ),
    first_utm_source = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_source), ''),
      nullif(btrim(excluded.first_utm_source), '')
    ),
    first_utm_medium = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_medium), ''),
      nullif(btrim(excluded.first_utm_medium), '')
    ),
    first_utm_campaign = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_campaign), ''),
      nullif(btrim(excluded.first_utm_campaign), '')
    ),
    first_utm_content = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_content), ''),
      nullif(btrim(excluded.first_utm_content), '')
    ),
    first_utm_term = coalesce(
      nullif(btrim(public.analytics_sessions.first_utm_term), ''),
      nullif(btrim(excluded.first_utm_term), '')
    ),
    first_meta_campaign_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_campaign_name), ''),
      nullif(btrim(excluded.first_meta_campaign_name), '')
    ),
    first_meta_adset_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_adset_name), ''),
      nullif(btrim(excluded.first_meta_adset_name), '')
    ),
    first_meta_ad_name = coalesce(
      nullif(btrim(public.analytics_sessions.first_meta_ad_name), ''),
      nullif(btrim(excluded.first_meta_ad_name), '')
    ),
    first_has_gclid = public.analytics_sessions.first_has_gclid or excluded.first_has_gclid,
    first_has_fbclid = public.analytics_sessions.first_has_fbclid or excluded.first_has_fbclid,
    first_has_msclkid = public.analytics_sessions.first_has_msclkid or excluded.first_has_msclkid,
    first_has_gbraid = public.analytics_sessions.first_has_gbraid or excluded.first_has_gbraid,
    first_has_wbraid = public.analytics_sessions.first_has_wbraid or excluded.first_has_wbraid,

    -- Last-touch: overwrite with new non-empty values whenever provided.
    last_landing_url = coalesce(nullif(btrim(excluded.last_landing_url), ''), public.analytics_sessions.last_landing_url),
    last_referrer = coalesce(nullif(btrim(excluded.last_referrer), ''), public.analytics_sessions.last_referrer),
    last_utm_source = coalesce(nullif(btrim(excluded.last_utm_source), ''), public.analytics_sessions.last_utm_source),
    last_utm_medium = coalesce(nullif(btrim(excluded.last_utm_medium), ''), public.analytics_sessions.last_utm_medium),
    last_utm_campaign = coalesce(nullif(btrim(excluded.last_utm_campaign), ''), public.analytics_sessions.last_utm_campaign),
    last_utm_content = coalesce(nullif(btrim(excluded.last_utm_content), ''), public.analytics_sessions.last_utm_content),
    last_utm_term = coalesce(nullif(btrim(excluded.last_utm_term), ''), public.analytics_sessions.last_utm_term),
    last_meta_campaign_name = coalesce(nullif(btrim(excluded.last_meta_campaign_name), ''), public.analytics_sessions.last_meta_campaign_name),
    last_meta_adset_name = coalesce(nullif(btrim(excluded.last_meta_adset_name), ''), public.analytics_sessions.last_meta_adset_name),
    last_meta_ad_name = coalesce(nullif(btrim(excluded.last_meta_ad_name), ''), public.analytics_sessions.last_meta_ad_name),
    last_has_gclid = public.analytics_sessions.last_has_gclid or excluded.last_has_gclid,
    last_has_fbclid = public.analytics_sessions.last_has_fbclid or excluded.last_has_fbclid,
    last_has_msclkid = public.analytics_sessions.last_has_msclkid or excluded.last_has_msclkid,
    last_has_gbraid = public.analytics_sessions.last_has_gbraid or excluded.last_has_gbraid,
    last_has_wbraid = public.analytics_sessions.last_has_wbraid or excluded.last_has_wbraid;
end;
$body$;

revoke all on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
) from public;

grant execute on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
) to service_role;

