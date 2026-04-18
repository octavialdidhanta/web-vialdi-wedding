/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Slug properti analytics (wajib di build publik): vialdi | vialdi-wedding | synckerja */
  readonly VITE_WEB_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
