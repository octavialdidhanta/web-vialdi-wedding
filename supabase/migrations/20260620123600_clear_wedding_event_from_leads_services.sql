-- Hub wedding step-2 used to set leads.services = '{pkg} — tanggal …, jam …'.
-- Strip event suffix; keep package label prefix only.

update public.leads
set services = nullif(btrim(split_part(services, ' — tanggal', 1)), '')
where web_id = 'vialdi-wedding'
  and services ~ '\s—\s*tanggal\s';
