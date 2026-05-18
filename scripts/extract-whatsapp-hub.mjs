import fs from "fs";

const src = fs.readFileSync("supabase/functions/wedding-package-lead/index.ts", "utf8");
const lines = src.split(/\r?\n/);
const start = lines.findIndex((l) => l.includes("async function sha256Hex"));
const end = lines.findIndex((l, i) => i > start && l.startsWith("function asWeddingStep"));
let body = lines.slice(start, end).join("\n");
body = body
  .replace(/wedding-package-lead/g, "contact-submit")
  .replace(/^async function sha256Hex/m, "export async function sha256Hex")
  .replace(/^function normalizePhone\(/m, "export function normalizePhoneE164(")
  .replace(/^async function resolveWhatsappPhoneNumberIdFromOrgTable/m, "export async function resolveWhatsappPhoneNumberIdFromOrgTable")
  .replace(/^type WhatsappSendResult[\s\S]*?\| \{ ok: false[\s\S]*?\};/m, "")
  .replace(/^type AdminClient = ReturnType<typeof createClient>;/m, "")
  .replace(/^type WhatsappDbOkForSync[\s\S]*?type WhatsappDbResultForSync = WhatsappDbOkForSync \| \{ error: string \};/m, "")
  .replace(/ReturnType<typeof createClient>/g, "SupabaseClient")
  .replace(/^async function resolveWhatsappTemplateEnvWithDb/m, "export async function resolveWhatsappTemplateEnvWithDb")
  .replace(/^function formatTemplateMessageBody/m, "export function formatTemplateMessageBody")
  .replace(/^function parseTemplateBodyKeysFromResolved/m, "export function parseTemplateBodyKeysFromResolved")
  .replace(/^async function sendWhatsappTemplateToClient/m, "export async function sendWhatsappTemplateToClient")
  .replace(/^async function syncLeadTicketAfterOutboundConversation/m, "export async function syncLeadTicketAfterOutboundConversation")
  .replace(/^async function upsertConversationAndInsertOutboundMessage/m, "export async function upsertConversationAndInsertOutboundMessage")
  .replace(/createClient/g, "SupabaseClient");

const header = `import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const ORG_WHATSAPP_TEMPLATE_ID = "06043eb4-e183-4c55-a9a3-89ec389bbd62";

export type WhatsappSendResult =
  | { ok: true; skipped?: boolean; skip_reason?: string; message_id?: string; response_text?: string }
  | { ok: false; skipped?: boolean; error: string; skip_reason?: string };

type AdminClient = SupabaseClient;
type WhatsappDbOkForSync = { conversation_id: string; message_id: string | null };
type WhatsappDbResultForSync = WhatsappDbOkForSync | { error: string };

`;

fs.writeFileSync("supabase/functions/_shared/whatsappHub.ts", header + body);
console.log("ok", (header + body).split("\n").length, "lines");
