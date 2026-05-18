-- Hub MVP seed: vialdi, vialdi-wedding, synckerja + contact-main form definitions.

-- Vialdi Wedding / agency operator org (existing production)
-- synckerja org: prefer row linked in analytics_web_access, else first org with name match
do $$
declare
  v_wedding_org uuid := '663c9336-8cb6-4a36-9ad9-313126e70a1a';
  v_synckerja_org uuid;
begin
  select a.organization_id into v_synckerja_org
  from public.analytics_web_access a
  where lower(a.web_id) = 'synckerja'
  limit 1;

  if v_synckerja_org is null then
    select o.id into v_synckerja_org
    from public.organizations o
    where lower(coalesce(o.company_name, '')) like '%synckerja%'
    limit 1;
  end if;

  if v_synckerja_org is null then
    v_synckerja_org := v_wedding_org;
  end if;

  insert into public.properties (slug, display_name, primary_domains, is_active, organization_id, tier, metadata)
  values
    (
      'vialdi',
      'Vialdi ID',
      array['vialdi.id', 'www.vialdi.id', 'localhost:8080', 'http://localhost:8080'],
      true,
      v_wedding_org,
      'internal',
      '{"notes":"Agency site — Web Vialdi ID - Final"}'::jsonb
    ),
    (
      'vialdi-wedding',
      'Vialdi Wedding',
      array['jasafotowedding.com', 'www.jasafotowedding.com', 'localhost:5173', 'http://localhost:5173'],
      true,
      v_wedding_org,
      'internal',
      '{"notes":"Wedding deploy — this repo"}'::jsonb
    ),
    (
      'synckerja',
      'Synckerja',
      array['synckerja.com', 'www.synckerja.com'],
      true,
      v_synckerja_org,
      'internal',
      '{"notes":"Legacy analytics compat"}'::jsonb
    )
  on conflict (slug) do update set
    display_name = excluded.display_name,
    primary_domains = excluded.primary_domains,
    is_active = excluded.is_active,
    organization_id = excluded.organization_id,
    tier = excluded.tier,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.property_web_id_aliases (alias, canonical_slug)
  values ('vialdi-id', 'vialdi')
  on conflict (alias) do update set canonical_slug = excluded.canonical_slug;
end $$;

-- form_definitions: vialdi contact-main (3 steps)
insert into public.form_definitions (web_id, form_id, version, title, schema, crm_mapping, is_active)
values (
  'vialdi',
  'contact-main',
  1,
  'Kontak utama — Vialdi ID',
  '{
    "version": 1,
    "steps": [
      {
        "step": 1,
        "fields": [
          { "key": "name", "type": "text", "required": true, "maxLength": 200 },
          { "key": "phone_number", "type": "phone", "required": true },
          { "key": "email", "type": "email", "required": true },
          { "key": "_hp", "type": "honeypot", "required": false }
        ]
      },
      {
        "step": 2,
        "fields": [
          { "key": "industry", "type": "text", "required": true, "maxLength": 200 },
          { "key": "business_type", "type": "select", "required": true, "options": ["B2B", "B2C"] }
        ]
      },
      {
        "step": 3,
        "fields": [
          { "key": "job_title", "type": "text", "required": true, "maxLength": 200 },
          { "key": "needs", "type": "textarea", "required": true, "maxLength": 4000 },
          { "key": "office_address", "type": "textarea", "required": true, "maxLength": 2000 }
        ]
      }
    ]
  }'::jsonb,
  '{
    "name": "name",
    "phone_number": "phone_number",
    "email": "email"
  }'::jsonb,
  true
)
on conflict (web_id, form_id) do update set
  version = excluded.version,
  title = excluded.title,
  schema = excluded.schema,
  crm_mapping = excluded.crm_mapping,
  is_active = excluded.is_active,
  updated_at = now();

-- form_definitions: vialdi-wedding contact-main (2 steps)
insert into public.form_definitions (web_id, form_id, version, title, schema, crm_mapping, is_active)
values (
  'vialdi-wedding',
  'contact-main',
  1,
  'Kontak utama — Vialdi Wedding',
  '{
    "version": 1,
    "steps": [
      {
        "step": 1,
        "fields": [
          { "key": "name", "type": "text", "required": true, "maxLength": 200 },
          { "key": "phone_number", "type": "phone", "required": true },
          { "key": "email", "type": "email", "required": true },
          { "key": "_hp", "type": "honeypot", "required": false }
        ]
      },
      {
        "step": 2,
        "fields": [
          { "key": "event_date", "type": "date", "required": true },
          { "key": "event_time", "type": "text", "required": true, "maxLength": 32 },
          { "key": "event_address", "type": "textarea", "required": true, "maxLength": 2000 },
          { "key": "consent", "type": "consent", "required": true }
        ]
      }
    ]
  }'::jsonb,
  '{
    "name": "name",
    "phone_number": "phone_number",
    "email": "email",
    "package_label": "package_label"
  }'::jsonb,
  true
)
on conflict (web_id, form_id) do update set
  version = excluded.version,
  title = excluded.title,
  schema = excluded.schema,
  crm_mapping = excluded.crm_mapping,
  is_active = excluded.is_active,
  updated_at = now();
