-- Admin inbox: list lead_submissions with property display_name (cms_admins see all web_id).

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

comment on function public.admin_list_lead_submissions is
  'CMS admin lead inbox; optional filter by web_id (canonical), form_id, date range.';
