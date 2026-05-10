-- CMS admin (/admin/requests): joined organization names need SELECT on `organizations`.

drop policy if exists "organizations_select_cms_admin" on public.organizations;
create policy "organizations_select_cms_admin"
  on public.organizations for select
  to authenticated
  using (exists (select 1 from public.cms_admins c where c.user_id = (select auth.uid())));
