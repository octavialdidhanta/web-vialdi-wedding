-- Idempotent outbound logging: one row per Meta message id when present.
create unique index if not exists uq_whatsapp_messages_wa_message_id
  on public.whatsapp_messages (wa_message_id)
  where wa_message_id is not null;
