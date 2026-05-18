-- Hub multi-website: property registry, form definitions, lead submissions, rate limits.

-- ---------------------------------------------------------------------------
-- properties (website registry; slug = web_id)
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  slug text not null,
  display_name text not null,
  primary_domains text[] not null default '{}',
  is_active boolean not null default true,
  organization_id uuid not null references public.organizations (id),
  tier text not null default 'client',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_pkey primary key (slug),
  constraint properties_slug_format check (slug ~ '^[a-z0-9-]{3,64}$'),
  constraint properties_tier_check check (tier in ('internal', 'client', 'enterprise'))
);

create index if not exists idx_properties_is_active on public.properties (is_active);
create index if not exists idx_properties_organization_id on public.properties (organization_id);

drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

comment on table public.properties is 'Website registry (web_id = slug). One row per tenant site.';

-- ---------------------------------------------------------------------------
-- property_web_id_aliases (build-time / legacy aliases → canonical slug)
-- ---------------------------------------------------------------------------
create table if not exists public.property_web_id_aliases (
  alias text not null,
  canonical_slug text not null references public.properties (slug) on delete cascade,
  created_at timestamptz not null default now(),
  constraint property_web_id_aliases_pkey primary key (alias),
  constraint property_web_id_aliases_alias_format check (alias ~ '^[a-z0-9-]{3,64}$')
);

create index if not exists idx_property_web_id_aliases_canonical
  on public.property_web_id_aliases (canonical_slug);

-- ---------------------------------------------------------------------------
-- form_definitions (one row per form per property; bump version on schema change)
-- ---------------------------------------------------------------------------
create table if not exists public.form_definitions (
  id uuid not null default gen_random_uuid(),
  web_id text not null references public.properties (slug) on delete restrict,
  form_id text not null,
  version int not null default 1,
  title text not null default '',
  schema jsonb not null default '{}',
  crm_mapping jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint form_definitions_pkey primary key (id),
  constraint form_definitions_web_form_unique unique (web_id, form_id)
);

create index if not exists idx_form_definitions_web_id_active
  on public.form_definitions (web_id, is_active);

drop trigger if exists set_form_definitions_updated_at on public.form_definitions;
create trigger set_form_definitions_updated_at
before update on public.form_definitions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lead_submissions (all tenants, all forms)
-- ---------------------------------------------------------------------------
create table if not exists public.lead_submissions (
  id uuid not null default gen_random_uuid(),
  web_id text not null references public.properties (slug) on delete restrict,
  form_id text not null,
  form_version int not null default 1,
  step int not null default 1,
  status text not null default 'draft',
  form_data jsonb not null default '{}',
  name text null,
  phone_number text null,
  email text null,
  package_label text null,
  analytics_session_id uuid null,
  attribution jsonb null,
  attribution_label text null,
  organization_id uuid not null references public.organizations (id),
  lead_id uuid null references public.leads (id) on delete set null,
  identity_hash text null,
  step1_dedupe_key text generated always as (
    case
      when analytics_session_id is not null and step = 1 and status = 'draft'
        then analytics_session_id::text
      else null
    end
  ) stored,
  final_dedupe_key text generated always as (
    case
      when analytics_session_id is not null
        and status = 'submitted'
        and identity_hash is not null
        and btrim(identity_hash) <> ''
        then analytics_session_id::text || ':' || identity_hash
      else null
    end
  ) stored,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_submissions_pkey primary key (id),
  constraint lead_submissions_status_check check (status in ('draft', 'submitted'))
);

create index if not exists idx_lead_submissions_web_created
  on public.lead_submissions (web_id, created_at desc);

create index if not exists idx_lead_submissions_web_form_status
  on public.lead_submissions (web_id, form_id, status);

create index if not exists idx_lead_submissions_lead_id
  on public.lead_submissions (lead_id);

create unique index if not exists uq_lead_submissions_step1_dedupe
  on public.lead_submissions (web_id, organization_id, step1_dedupe_key)
  where step1_dedupe_key is not null;

create unique index if not exists uq_lead_submissions_final_dedupe
  on public.lead_submissions (web_id, organization_id, final_dedupe_key)
  where final_dedupe_key is not null;

drop trigger if exists set_lead_submissions_updated_at on public.lead_submissions;
create trigger set_lead_submissions_updated_at
before update on public.lead_submissions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- hub_rate_limits (token bucket per web_id + client IP hash)
-- ---------------------------------------------------------------------------
create table if not exists public.hub_rate_limits (
  web_id text not null references public.properties (slug) on delete cascade,
  client_ip_hash text not null,
  bucket_window timestamptz not null,
  tokens int not null default 0,
  constraint hub_rate_limits_pkey primary key (web_id, client_ip_hash, bucket_window)
);

-- ---------------------------------------------------------------------------
-- RLS: service role only (Edge writes); no anon/authenticated policies
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.property_web_id_aliases enable row level security;
alter table public.form_definitions enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.hub_rate_limits enable row level security;

-- CMS admins can read properties for picker (admin UI)
drop policy if exists "properties_select_cms_admin" on public.properties;
create policy "properties_select_cms_admin"
  on public.properties for select
  to authenticated
  using (exists (select 1 from public.cms_admins c where c.user_id = (select auth.uid())));
