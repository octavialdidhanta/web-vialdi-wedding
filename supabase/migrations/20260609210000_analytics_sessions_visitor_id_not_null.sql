-- Stable visitor id (browser/device scope) per analytics session row; required for joins and quality.
-- Client: localStorage via getOrCreateVisitorId(); Edge falls back to session_id if absent.

alter table public.analytics_sessions
  add column if not exists visitor_id text;

comment on column public.analytics_sessions.visitor_id is
  'First-party visitor id (stable across tabs/sessions on same origin); not null. Legacy rows backfilled from id.';

update public.analytics_sessions
set visitor_id = id::text
where visitor_id is null
   or btrim(visitor_id) = '';

alter table public.analytics_sessions
  alter column visitor_id set not null;

alter table public.analytics_sessions
  drop constraint if exists analytics_sessions_visitor_id_nonempty;

alter table public.analytics_sessions
  add constraint analytics_sessions_visitor_id_nonempty
  check (char_length(btrim(visitor_id)) between 1 and 64);

create index if not exists idx_analytics_sessions_web_visitor
  on public.analytics_sessions (web_id, visitor_id);

-- ---------------------------------------------------------------------------
-- RPC: analytics_session_touch — add p_visitor_id (default null → session uuid text)
-- CREATE OR REPLACE does not remove the legacy 19-arg overload; drop it after the new signature exists.
-- ---------------------------------------------------------------------------

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
  p_has_wbraid boolean default false,
  p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_visitor text;
begin
  if p_web_id is null or btrim(p_web_id) = '' or p_web_id not in ('vialdi', 'vialdi-wedding', 'synckerja') then
    raise exception 'invalid web_id' using errcode = '22023';
  end if;

  v_visitor := left(coalesce(nullif(trim(p_visitor_id), ''), p_session::text), 64);

  insert into public.analytics_sessions (
    id, web_id, visitor_id, referrer, ua_hash, auth_user_id,
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
    v_visitor,
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
    visitor_id = excluded.visitor_id,
    referrer = coalesce(excluded.referrer, public.analytics_sessions.referrer),
    ua_hash = coalesce(excluded.ua_hash, public.analytics_sessions.ua_hash),
    auth_user_id = coalesce(excluded.auth_user_id, public.analytics_sessions.auth_user_id),

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
  boolean, boolean, boolean, boolean, boolean,
  text
) from public;

grant execute on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean,
  text
) to service_role;

drop function if exists public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
);
