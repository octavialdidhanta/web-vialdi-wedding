-- Broadcast analytics table writes to Supabase Realtime so admin clients can subscribe.
-- After migrate: in Dashboard Table Editor you can still click "Enable Realtime" per table;
-- this migration adds tables to the supabase_realtime publication when missing.

do $migration$
begin
  if not exists (
    select 1
    from pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'analytics_sessions'
  ) then
    alter publication supabase_realtime add table public.analytics_sessions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'analytics_page_views'
  ) then
    alter publication supabase_realtime add table public.analytics_page_views;
  end if;

  if not exists (
    select 1
    from pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'analytics_click_events'
  ) then
    alter publication supabase_realtime add table public.analytics_click_events;
  end if;
end
$migration$;
