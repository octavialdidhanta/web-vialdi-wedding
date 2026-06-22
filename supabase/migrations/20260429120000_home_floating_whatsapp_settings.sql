-- Floating WhatsApp button config per web_id (public read, admin write).

create table if not exists public.home_floating_whatsapp_settings (
  web_id text not null primary key
    constraint home_floating_whatsapp_settings_web_id_check
      check (web_id = any (array['vialdi'::text, 'vialdi-wedding'::text])),
  is_enabled boolean not null default false,
  phone_digits text null
    constraint home_floating_whatsapp_settings_phone_digits_len
      check (
        phone_digits is null
        or (
          phone_digits ~ '^[0-9]+$'
          and length(phone_digits) between 8 and 15
        )
      ),
  prefill_message text not null default ''
    constraint home_floating_whatsapp_settings_prefill_len
      check (length(prefill_message) <= 2000),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_home_floating_whatsapp_settings_updated_at on public.home_floating_whatsapp_settings;
create trigger set_home_floating_whatsapp_settings_updated_at
  before update on public.home_floating_whatsapp_settings
  for each row execute function public.set_updated_at();

alter table public.home_floating_whatsapp_settings enable row level security;

drop policy if exists home_floating_whatsapp_settings_select_public on public.home_floating_whatsapp_settings;
create policy home_floating_whatsapp_settings_select_public
  on public.home_floating_whatsapp_settings for select
  using (true);

drop policy if exists home_floating_whatsapp_settings_insert_admin on public.home_floating_whatsapp_settings;
create policy home_floating_whatsapp_settings_insert_admin
  on public.home_floating_whatsapp_settings for insert
  to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists home_floating_whatsapp_settings_update_admin on public.home_floating_whatsapp_settings;
create policy home_floating_whatsapp_settings_update_admin
  on public.home_floating_whatsapp_settings for update
  to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));
