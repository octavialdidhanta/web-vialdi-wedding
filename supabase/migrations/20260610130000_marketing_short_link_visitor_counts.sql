-- Unique visitors per short link: stable id from first-party cookie (see Vercel proxy + link-redirect).
-- Raw click_count still increments every redirect.

alter table public.marketing_short_links
  add column if not exists visitor_count bigint not null default 0;

comment on column public.marketing_short_links.visitor_count is
  'Distinct visitor keys seen for this slug (cookie/header); not raw clicks.';

create table if not exists public.marketing_short_link_visitors (
  link_id uuid not null references public.marketing_short_links (id) on delete cascade,
  visitor_key text not null
    constraint marketing_short_link_visitors_key_len
      check (char_length(btrim(visitor_key)) between 1 and 64),
  first_seen_at timestamptz not null default now(),
  primary key (link_id, visitor_key)
);

create index if not exists marketing_short_link_visitors_link_idx
  on public.marketing_short_link_visitors (link_id);

alter table public.marketing_short_link_visitors enable row level security;

comment on table public.marketing_short_link_visitors is
  'First-seen visitor key per marketing short link (browser cookie scope).';

create or replace function public.record_marketing_short_link_visitor(
  p_link_id uuid,
  p_visitor_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
begin
  if p_visitor_key is null or btrim(p_visitor_key) = '' then
    return;
  end if;

  with ins as (
    insert into public.marketing_short_link_visitors (link_id, visitor_key)
    values (p_link_id, left(btrim(p_visitor_key), 64))
    on conflict (link_id, visitor_key) do nothing
    returning link_id
  )
  update public.marketing_short_links m
  set visitor_count = visitor_count + 1
  from ins
  where m.id = ins.link_id
    and m.active = true;
end;
$body$;

revoke all on function public.record_marketing_short_link_visitor(uuid, text) from public;
grant execute on function public.record_marketing_short_link_visitor(uuid, text) to service_role;
