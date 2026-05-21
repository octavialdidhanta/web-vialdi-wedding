-- Google Ads offline conversion: dedicated gclid column (first-touch sticky per session).

begin;

alter table public.analytics_sessions
  add column if not exists gclid text null;

alter table public.analytics_wa_clicks
  add column if not exists gclid text null;

alter table public.lead_submissions
  add column if not exists gclid text null;

alter table public.leads
  add column if not exists gclid text null;

comment on column public.analytics_sessions.gclid is
  'First-touch Google Click ID for this session (sticky; not overwritten on later touches).';
comment on column public.analytics_wa_clicks.gclid is
  'Google Click ID at floating WhatsApp click time.';
comment on column public.lead_submissions.gclid is
  'Google Click ID from analytics session (offline conversion export).';
comment on column public.leads.gclid is
  'Google Click ID from analytics session (offline conversion export).';

create index if not exists idx_analytics_wa_clicks_gclid
  on public.analytics_wa_clicks (web_id, gclid)
  where gclid is not null;

create index if not exists idx_lead_submissions_gclid
  on public.lead_submissions (web_id, gclid)
  where gclid is not null;

create index if not exists idx_leads_gclid
  on public.leads (web_id, gclid)
  where gclid is not null;

-- ---------------------------------------------------------------------------
-- analytics_session_touch: add p_gclid (first-touch sticky on update)
-- ---------------------------------------------------------------------------
drop function if exists public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean,
  text
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
  p_has_wbraid boolean default false,
  p_visitor_id text default null,
  p_gclid text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_visitor text;
  v_web text;
  v_gclid text;
begin
  v_web := public.hub_require_active_web_id(p_web_id, false);
  v_visitor := left(coalesce(nullif(trim(p_visitor_id), ''), p_session::text), 64);
  v_gclid := left(nullif(btrim(p_gclid), ''), 500);

  insert into public.analytics_sessions (
    id, web_id, visitor_id, referrer, ua_hash, auth_user_id,
    landing_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    meta_campaign_name, meta_adset_name, meta_ad_name,
    has_gclid, has_fbclid, has_msclkid, has_gbraid, has_wbraid,
    gclid,

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
    v_web,
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
    v_gclid,

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

    gclid = coalesce(
      nullif(btrim(public.analytics_sessions.gclid), ''),
      nullif(btrim(excluded.gclid), '')
    ),

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
  text, text
) from public;

grant execute on function public.analytics_session_touch(
  uuid, text, text, text, uuid,
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, boolean, boolean,
  text, text
) to service_role;

-- ---------------------------------------------------------------------------
-- admin_list_lead_submissions: expose gclid for QA
-- ---------------------------------------------------------------------------
drop function if exists public.admin_list_lead_submissions(text, timestamptz, timestamptz, text, int, int);

create or replace function public.admin_list_lead_submissions(
  p_web_id text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_form_id text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  web_id text,
  property_display_name text,
  form_id text,
  form_version int,
  step int,
  status text,
  name text,
  phone_number text,
  email text,
  package_label text,
  lead_id uuid,
  analytics_session_id uuid,
  gclid text,
  attribution_label text,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  form_data jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w text;
  lim int;
  off int;
begin
  if not exists (select 1 from public.cms_admins c where c.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  w := public.hub_require_active_web_id(p_web_id, true);
  lim := greatest(1, least(coalesce(p_limit, 50), 200));
  off := greatest(coalesce(p_offset, 0), 0);

  return query
  select
    ls.id,
    ls.web_id,
    p.display_name as property_display_name,
    ls.form_id,
    ls.form_version,
    ls.step,
    ls.status,
    ls.name,
    ls.phone_number,
    ls.email,
    ls.package_label,
    ls.lead_id,
    ls.analytics_session_id,
    ls.gclid,
    ls.attribution_label,
    ls.submitted_at,
    ls.created_at,
    ls.updated_at,
    ls.form_data
  from public.lead_submissions ls
  inner join public.properties p on p.slug = ls.web_id
  where (w is null or ls.web_id = w)
    and (p_form_id is null or btrim(p_form_id) = '' or ls.form_id = btrim(p_form_id))
    and (p_from is null or ls.created_at >= p_from)
    and (p_to is null or ls.created_at < p_to)
  order by ls.created_at desc
  limit lim
  offset off;
end;
$$;

revoke all on function public.admin_list_lead_submissions(text, timestamptz, timestamptz, text, int, int) from public;
grant execute on function public.admin_list_lead_submissions(text, timestamptz, timestamptz, text, int, int) to authenticated;

commit;
