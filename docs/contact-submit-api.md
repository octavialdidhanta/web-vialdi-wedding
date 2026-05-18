# contact-submit API (Hub)

Generic multi-step form submission for all properties in the Supabase hub.

## Endpoint

`POST {SUPABASE_URL}/functions/v1/contact-submit`

Headers: `Content-Type: application/json`, `apikey`, `Authorization: Bearer <anon or service role>`

## Request body

```json
{
  "web_id": "vialdi-wedding",
  "form_id": "contact-main",
  "step": 1,
  "id": "optional-uuid-for-autosave",
  "form_data": {
    "name": "Jane",
    "phone_number": "+6281234567890",
    "email": "jane@example.com"
  },
  "package_label": "optional",
  "attribution": {},
  "analytics_session_id": "uuid — required on final step only"
}
```

## Response (200)

```json
{
  "submission_id": "uuid",
  "lead_id": "uuid",
  "id": "uuid"
}
```

Honeypot triggered: `{ "ok": true, "submission_id": null, "lead_id": null }`

## Errors

| Status | Meaning |
|--------|---------|
| 400 | Validation / unknown field / missing final-step attribution |
| 403 | `property_inactive` |
| 404 | `unknown_web_id` |
| 429 | Rate limit (per web_id + IP) |

## Wedding 2-step example (Postman)

**Step 1**

```json
{
  "web_id": "vialdi-wedding",
  "form_id": "contact-main",
  "step": 1,
  "form_data": {
    "name": "Test",
    "phone_number": "+628111222333",
    "email": "test@example.com"
  },
  "package_label": "Konsultasi umum — halaman kontak"
}
```

**Step 2** — use `id` from step 1; include `attribution` + `analytics_session_id`:

```json
{
  "web_id": "vialdi-wedding",
  "form_id": "contact-main",
  "step": 2,
  "id": "<submission_id>",
  "form_data": {
    "event_date": "2026-06-01",
    "event_time": "14:00",
    "event_address": "Jakarta",
    "consent": true
  },
  "attribution": { "landing_url": "https://jasafotowedding.com/kontak" },
  "analytics_session_id": "<session-uuid>"
}
```

## Legacy proxy

`POST /functions/v1/contact-lead` forwards to `contact-submit` with field mapping for existing clients.
