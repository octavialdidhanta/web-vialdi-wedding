# Onboarding a new property (Hub)

Adding client #N does **not** require Edge redeploy or new SQL migrations.

## Checklist

1. **Insert property**

```sql
INSERT INTO public.properties (slug, display_name, primary_domains, organization_id, tier, is_active)
VALUES (
  'acme-dental-jakarta',
  'Acme Dental Jakarta',
  ARRAY['acmedental.id', 'www.acmedental.id'],
  '<organization_uuid>',
  'client',
  true
);
```

2. **Insert form definition** (`contact-main` or custom `form_id`)

```sql
INSERT INTO public.form_definitions (web_id, form_id, version, title, schema, crm_mapping, is_active)
VALUES (
  'acme-dental-jakarta',
  'contact-main',
  1,
  'Contact',
  '{"version":1,"steps":[...]}'::jsonb,
  '{"name":"name","phone_number":"phone_number","email":"email"}'::jsonb,
  true
);
```

3. **Optional alias** (build env typo / legacy slug)

```sql
INSERT INTO public.property_web_id_aliases (alias, canonical_slug)
VALUES ('acme-id', 'acme-dental-jakarta');
```

4. **Deploy frontend** with `VITE_WEB_ID=acme-dental-jakarta` and same `VITE_SUPABASE_URL` as hub. Set the same value on Vercel for **Edge** routes (`api/blog-entry`, `api/blog-share`, `api/blog-og-image`) so OG/share preview only loads posts for that property.

5. **CORS** — add production origin to Edge secret `ALLOWED_ORIGINS` (comma-separated). Mirror domains in `primary_domains` for ops reference.

### Blog CMS (optional)

- Posts, categories, and tags are scoped by `web_id` in `posts`, `blog_categories`, and `blog_tags`.
- Each deploy’s admin (`/admin/posts`) only lists content for its `VITE_WEB_ID`.
- Slugs are unique per property: `(web_id, slug)` on posts and taxonomy tables.

### Package CMS (optional)

- Packages live in `property_packages` with `web_id` (FK to `properties.slug`).
- Admin `/admin/packages` lists only rows for the deploy’s `VITE_WEB_ID`.
- Slug unique per property: `(web_id, slug)`.
- Media uploads go to bucket `package-media` at `{web_id}/packages/{userId}/...`.
- Agency-only fields (`summary`, `spent_budget_*`, `fee_percent`) are used when `web_id = 'vialdi'`.

6. **Optional** — `organization_whatsapp_templates` / floating WA rows for `web_id`.

7. **Analytics access (cross-org only)** — untuk organisasi **selain** pemilik property: row di `analytics_web_access` + approve manual. Org pemilik property + token SDK aktif → Traffic auto-approved (v1.4.13, lihat `API_ACCESSIBILITY_DOCS.md`).

## Verify

- `POST contact-submit` with new `web_id` → 200
- `POST analytics-ingest` with same `web_id` → 200
- No changes to `ALLOWED_WEB_IDS` in Edge source

## MVP internal slugs

| slug | Site |
|------|------|
| `vialdi` | Vialdi ID (agency) |
| `vialdi-wedding` | Vialdi Wedding |
| `synckerja` | Legacy analytics compat |
