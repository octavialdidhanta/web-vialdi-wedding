/** Google Tag Manager container (snippet utama ada di index.html). */
export const GTM_CONTAINER_ID = "GTM-NPJBZX8";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function getDataLayer(): Record<string, unknown>[] {
  if (typeof window === "undefined") {
    return [];
  }
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

/**
 * Virtual page view untuk SPA — buat Trigger Custom Event di GTM, mis. nama event
 * `spa_virtual_page_view`, lalu hubungkan ke tag GA4 (page_view) dengan override
 * page_location / page_path dari Data Layer Variables.
 */
export function pushGtmVirtualPageView(pathname: string): void {
  if (typeof window === "undefined" || !pathname) {
    return;
  }
  getDataLayer().push({
    event: "spa_virtual_page_view",
    page_path: pathname,
    page_location: window.location.href,
    page_title: typeof document !== "undefined" ? document.title : "",
  });
}

/** Klik / interaksi yang relevan untuk GTM (bukan setiap node DOM). */
export function pushGtmUserInteraction(payload: {
  page_path: string;
  element_tag: string;
  element_label: string;
  track_key?: string | null;
  link_url?: string | null;
  is_internal_link?: boolean;
}): void {
  getDataLayer().push({
    event: "user_interaction",
    ...payload,
  });
}

export function pushGtmFormSubmit(payload: { page_path: string; form_id?: string | null; action?: string | null }) {
  getDataLayer().push({
    event: "form_submit",
    ...payload,
  });
}
