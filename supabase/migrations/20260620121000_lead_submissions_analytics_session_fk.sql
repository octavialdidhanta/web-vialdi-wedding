-- lead_submissions.analytics_session_id → analytics_sessions.id

-- Clear orphan session ids before adding FK (legacy backfill / deleted sessions).
update public.lead_submissions ls
set analytics_session_id = null
where ls.analytics_session_id is not null
  and not exists (
    select 1
    from public.analytics_sessions s
    where s.id = ls.analytics_session_id
  );

alter table public.lead_submissions
  drop constraint if exists lead_submissions_analytics_session_id_fkey;

alter table public.lead_submissions
  add constraint lead_submissions_analytics_session_id_fkey
  foreign key (analytics_session_id)
  references public.analytics_sessions (id)
  on delete set null;

create index if not exists idx_lead_submissions_analytics_session_id
  on public.lead_submissions (analytics_session_id)
  where analytics_session_id is not null;

comment on column public.lead_submissions.analytics_session_id is
  'Anonymous analytics session; FK to analytics_sessions.id (null if session removed).';
