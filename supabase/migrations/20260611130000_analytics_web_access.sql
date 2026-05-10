-- CMS (/admin/requests): allow cms_admins to read & approve rows in existing `analytics_web_access`
-- (organization_id + web_id mapping; is_approved). Org-scoped policies may already exist.

drop policy if exists "analytics_web_access_select_cms_admin" on public.analytics_web_access;
create policy "analytics_web_access_select_cms_admin"
  on public.analytics_web_access for select
  to authenticated
  using (exists (select 1 from public.cms_admins c where c.user_id = (select auth.uid())));

drop policy if exists "analytics_web_access_update_cms_admin" on public.analytics_web_access;
create policy "analytics_web_access_update_cms_admin"
  on public.analytics_web_access for update
  to authenticated
  using (exists (select 1 from public.cms_admins c where c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins c where c.user_id = (select auth.uid())));
