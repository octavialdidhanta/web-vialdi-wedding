-- Meta columns on analytics_sessions + analytics_session_touch (19-arg). Admin summary: see 20260420120600_admin_analytics_summary_meta_utm_detail.sql.

alter table public.analytics_sessions
  add column if not exists meta_campaign_name text null,
  add column if not exists meta_adset_name text null,
  add column if not exists meta_ad_name text null;

comment on column public.analytics_sessions.meta_campaign_name is 'Meta Ads: from URL param meta_campaign (e.g. {{campaign.name}}).';
comment on column public.analytics_sessions.meta_adset_name is 'Meta Ads: from URL param meta_adset (e.g. {{adset.name}}).';
comment on column public.analytics_sessions.meta_ad_name is 'Meta Ads: from URL param meta_ad (e.g. {{ad.name}}).';

revoke execute on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
) from service_role;

drop function if exists public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean
);

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
    has_gclid, has_fbclid, has_msclkid, has_gbraid, has_wbraid
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
    coalesce(p_has_wbraid, false)
  )
  on conflict (id) do update set
    last_seen_at = now(),
    web_id = excluded.web_id,
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
    has_wbraid = public.analytics_sessions.has_wbraid or excluded.has_wbraid;
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