-- Modal "Detail klik" memakai get_click_targets_for_path; sebelumnya hanya membaca
-- analytics_daily_top_click_targets (rollup sering kosong) sementara Top pages
-- menghitung klik dari analytics_click_events. Selaraskan ke events mentah.

create or replace function public.get_click_targets_for_path(
  p_web_id text,
  p_from date,
  p_to date,
  p_path text,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_from date;
  v_to date;
  v_min date;
  v_max date;
  v_web text;
begin
  if p_web_id is null or btrim(p_web_id) = '' then
    raise exception 'web_id is required';
  end if;

  if p_path is null or btrim(p_path) = '' then
    raise exception 'path is required';
  end if;

  v_web := public.hub_require_active_web_id(p_web_id, false);

  if not public.can_access_web_id(v_web) then
    raise exception 'forbidden';
  end if;

  select min(day), max(day)
  into v_min, v_max
  from public.analytics_daily_sessions
  where web_id = v_web;

  if v_min is null or v_max is null then
    -- Belum ada rollup sesi; tetap izinkan detail klik dari events mentah.
    v_from := coalesce(p_from, (timezone('Asia/Jakarta', now()))::date);
    v_to := coalesce(p_to, v_from);
  else
    v_from := coalesce(p_from, v_min);
    v_to := coalesce(p_to, v_max);
  end if;

  if v_to < v_from then
    raise exception 'invalid range';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'clicks', clicks,
      'unique_sessions', unique_sessions,
      'track_key', nullif(track_key, ''),
      'element_type', element_type,
      'element_label', element_label,
      'target_url', nullif(target_url, ''),
      'is_internal', is_internal
    ) order by clicks desc), '[]'::jsonb)
    from (
      select
        count(*)::bigint as clicks,
        count(distinct ce.session_id)::bigint as unique_sessions,
        coalesce(ce.track_key, '') as track_key,
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, '') as target_url,
        coalesce(ce.is_internal, false) as is_internal
      from public.analytics_click_events ce
      where ce.web_id = v_web
        and (timezone('Asia/Jakarta', ce.created_at))::date between v_from and v_to
        and public.traffic_path_key(ce.path) = public.traffic_path_key(p_path)
      group by
        coalesce(ce.track_key, ''),
        ce.element_type,
        ce.element_label,
        coalesce(ce.target_url, ''),
        coalesce(ce.is_internal, false)
      order by count(*) desc
      limit greatest(1, least(p_limit, 200))
    ) s
  );
end;
$function$;
