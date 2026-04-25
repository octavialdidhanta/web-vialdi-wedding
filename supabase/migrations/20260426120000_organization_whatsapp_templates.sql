-- Per-(organization_id, web_id) WhatsApp template metadata for Edge Functions (service role).
-- Replaces scaling many Supabase secrets (WHATSAPP_TEMPLATE_*__SUFFIX) with DB rows.

create table if not exists public.organization_whatsapp_templates (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  web_id text not null
    constraint organization_whatsapp_templates_web_id_len
      check (char_length(trim(web_id)) between 1 and 128),
  is_active boolean not null default true,
  template_name text not null
    constraint organization_whatsapp_templates_name_len
      check (char_length(trim(template_name)) between 1 and 256),
  template_language text not null default 'en_US'
    constraint organization_whatsapp_templates_lang_len
      check (char_length(trim(template_language)) between 1 and 32),
  body_keys text null
    constraint organization_whatsapp_templates_body_keys_len
      check (body_keys is null or char_length(body_keys) <= 4000),
  body_parameter_names text null
    constraint organization_whatsapp_templates_param_names_len
      check (body_parameter_names is null or char_length(body_parameter_names) <= 4000),
  components_json text null
    constraint organization_whatsapp_templates_components_len
      check (components_json is null or char_length(components_json) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_whatsapp_templates_org_web_unique unique (organization_id, web_id)
);

create index if not exists organization_whatsapp_templates_org_active_idx
  on public.organization_whatsapp_templates (organization_id)
  where is_active = true;

drop trigger if exists set_organization_whatsapp_templates_updated_at on public.organization_whatsapp_templates;
create trigger set_organization_whatsapp_templates_updated_at
  before update on public.organization_whatsapp_templates
  for each row execute function public.set_updated_at();

alter table public.organization_whatsapp_templates enable row level security;

-- No policies: deny via PostgREST for anon/authenticated; Edge uses service_role (bypasses RLS).

revoke all on public.organization_whatsapp_templates from public;
grant select, insert, update, delete on public.organization_whatsapp_templates to service_role;
