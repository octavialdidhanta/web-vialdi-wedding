-- Seed / upsert WhatsApp template config for wedding traffic (`web_id` = vialdi-wedding).
-- Edit `template_name` (and optionally `template_language`, `body_keys`) to match your approved Meta template
-- before running in production.

insert into public.organization_whatsapp_templates (
  organization_id,
  web_id,
  is_active,
  template_name,
  template_language,
  body_keys,
  body_parameter_names,
  components_json
) values (
  '663c9336-8cb6-4a36-9ad9-313126e70a1a',
  'vialdi-wedding',
  true,
  'REPLACE_WITH_META_TEMPLATE_NAME_WEDDING',
  'id',
  'name,name,event_date,event_time,package_label',
  null,
  null
)
on conflict (organization_id, web_id) do update set
  is_active = excluded.is_active,
  template_name = excluded.template_name,
  template_language = excluded.template_language,
  body_keys = excluded.body_keys,
  body_parameter_names = excluded.body_parameter_names,
  components_json = excluded.components_json,
  updated_at = now();
