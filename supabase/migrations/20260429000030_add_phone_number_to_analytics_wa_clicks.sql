-- Add sender phone_number to analytics_wa_clicks so inbound WhatsApp webhook
-- can propagate it to `leads`.

alter table public.analytics_wa_clicks
  add column if not exists phone_number text null;

