-- Wedding hub used to mirror legacy CRM: occupation = 'Acara: date (time)'.
-- Event details belong in form_data + notes (+ location for address).

update public.lead_submissions
set
  occupation = null,
  location = coalesce(
    nullif(btrim(location), ''),
    nullif(btrim(form_data ->> 'event_address'), '')
  )
where occupation ~ '^Acara:\s';

update public.lead_client_profiles p
set
  occupation = null,
  location = coalesce(nullif(btrim(p.location), ''), nullif(btrim(s.location), '')),
  notes = coalesce(nullif(btrim(p.notes), ''), nullif(btrim(s.notes), ''))
from public.lead_submissions s
where s.lead_id = p.lead_id
  and p.occupation ~ '^Acara:\s'
  and s.id = (
    select ls.id
    from public.lead_submissions ls
    where ls.lead_id = p.lead_id
    order by (ls.status = 'submitted') desc, ls.updated_at desc nulls last
    limit 1
  );
