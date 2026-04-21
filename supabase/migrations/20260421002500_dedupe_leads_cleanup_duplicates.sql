-- Cleanup duplicates in `public.leads` after introducing funnel_key.
-- This migration is designed to be safe even when no duplicates exist.
--
-- Winner selection prefers rows that already have a ticket_id / WA ticket, then newest updated_at/created_at.

with ranked as (
  select
    l.id,
    l.organization_id,
    l.dedupe_key,
    row_number() over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as rn,
    first_value(l.id) over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as winner_id
  from public.leads l
  where l.dedupe_key is not null
),
dups as (
  select id, winner_id
  from ranked
  where rn > 1 and winner_id is not null and id <> winner_id
)
-- Re-point known FKs to the winner lead.
update public.lead_client_profiles p
set lead_id = d.winner_id
from dups d
where p.lead_id = d.id;

with ranked as (
  select
    l.id,
    l.organization_id,
    l.dedupe_key,
    row_number() over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as rn,
    first_value(l.id) over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as winner_id
  from public.leads l
  where l.dedupe_key is not null
),
dups as (
  select id, winner_id
  from ranked
  where rn > 1 and winner_id is not null and id <> winner_id
)
update public.leads_vialdi_wedding w
set lead_id = d.winner_id
from dups d
where w.lead_id = d.id;

with ranked as (
  select
    l.id,
    l.organization_id,
    l.dedupe_key,
    row_number() over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as rn,
    first_value(l.id) over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as winner_id
  from public.leads l
  where l.dedupe_key is not null
),
dups as (
  select id, winner_id
  from ranked
  where rn > 1 and winner_id is not null and id <> winner_id
)
update public.leads_vialdiid v
set lead_id = d.winner_id
from dups d
where v.lead_id = d.id;

-- Finally delete the loser leads.
with ranked as (
  select
    l.id,
    l.organization_id,
    l.dedupe_key,
    row_number() over (
      partition by l.organization_id, l.dedupe_key
      order by
        (case when l.ticket_id is not null and btrim(l.ticket_id) <> '' then 1 else 0 end) desc,
        l.updated_at desc,
        l.created_at desc
    ) as rn
  from public.leads l
  where l.dedupe_key is not null
),
to_delete as (
  select id from ranked where rn > 1
)
delete from public.leads l
using to_delete d
where l.id = d.id;

