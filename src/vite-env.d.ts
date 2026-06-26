/// <reference types="vite/client" />
/// <reference path="./types/vite-imagetools-and-iframe.d.ts" />

interface ImportMetaEnv {
  /** Synckerja Omnichannel API v1.4.15 — base URL (SDK token scope) */
  readonly VITE_SYNCKERJA_API_BASE?: string;
  /** Synckerja SDK token (`sk_omni_...`) — tipe SDK; ter-bundle di browser (allowed origins di dashboard Synckerja) */
  readonly VITE_SYNCKERJA_SDK_TOKEN?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** `true` / `1`: pakai `/storage/v1/render/image` (WebP + resize). Perlu Image Transformations di Supabase. */
  readonly VITE_SUPABASE_IMAGE_TRANSFORM?: string;
  /** Origin publik untuk menyalin short link (tanpa trailing slash), mis. https://jasafotowedding.com */
  readonly VITE_PUBLIC_SITE_ORIGIN?: string;
  /** CMS property slug (posts/packages): `vialdi-wedding` */
  readonly VITE_CMS_PROPERTY_SLUG?: string;
  /** @deprecated Use VITE_CMS_PROPERTY_SLUG */
  readonly VITE_WEB_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    SynckerjaConfig?: {
      apiBase?: string;
      token?: string;
    };
    SynckerjaTrackLead?: (
      a: Record<string, unknown> | string,
      b?: string | null,
      c?: string | null,
      d?: string | null,
    ) => Promise<void>;
  }
}

export {};
