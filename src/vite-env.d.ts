/// <reference types="vite/client" />
/// <reference path="./types/vite-imagetools-and-iframe.d.ts" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Slug properti analytics (wajib di build publik): vialdi | vialdi-wedding | synckerja */
  readonly VITE_WEB_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
