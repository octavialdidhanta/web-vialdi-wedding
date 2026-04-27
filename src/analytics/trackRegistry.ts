/**
 * Kunci resmi untuk agregasi global (CTR, konversi service).
 * Pasang di markup: data-track="contact_cta" (nilai harus salah satu konstanta di bawah).
 */
export const TRACK_KEYS = {
  /** Tombol / tautan utama ke halaman kontak (header, hero, blog CTA, dll.) */
  contactCta: "contact_cta",
  /** Tombol Floating WhatsApp (ikon WA) */
  whatsappFloatingClick: "whatsapp_floating_click",
  /** Kirim formulir subscribe footer (jika nanti terhubung ke backend) */
  footerSubscribe: "footer_subscribe_submit",
  /** Logo / brand ke home */
  navLogoHome: "nav_logo_home",
  /** Nav desktop/mobile */
  navHomeLink: "nav_home_link",
  navAboutLink: "nav_about_link",
  navServiceLink: "nav_service_link",
  navBlogLink: "nav_blog_link",
  navTermsLink: "nav_terms_link",
  navMenuOpenCta: "nav_menu_open_cta",
  navServiceCta: "nav_service_cta",

  /** Home: hero & sections */
  homeHeroConsultCta: "home_hero_consult_cta",
  homeCtaSectionCta: "home_cta_section_cta",
  homeGaransiMobileCta: "home_garansi_mobile_cta",
  homeTrustConsultCta: "home_trust_consult_cta",

  /** Home: paket tabs */
  homePackageTabDokumentasiCta: "home_package_tab_dokumentasi_cta",
  homePackageTabRiasGaunCta: "home_package_tab_rias_gaun_cta",
  homePackageTabDekorasiCta: "home_package_tab_dekorasi_cta",
  homePackageTabAllInOneCta: "home_package_tab_all_in_one_cta",

  /** Home: sticky footer (scroll nav) */
  homeStickyHargaPaketCta: "home_sticky_harga_paket_cta",
  homeStickyInstagramCta: "home_sticky_instagram_cta",
  homeStickyGaransiCta: "home_sticky_garansi_cta",
  homeStickyFaqCta: "home_sticky_faq_cta",
  homeStickyScrollCta: "home_sticky_scroll_cta",

  /** Home: konsultasi paket (popup form) */
  packageConsultOpenCta: "package_consult_open_cta",
  packageConsultNextCta: "package_consult_next_cta",
  packageConsultSubmitCta: "package_consult_submit_cta",
  packageConsultResetCta: "package_consult_reset_cta",
  packageConsultViewDetailLink: "package_consult_view_detail_link",

  /** Thank you page */
  thankYouBackHomeCta: "thank_you_back_home_cta",
  thankYouViewServiceCta: "thank_you_view_service_cta",
} as const;

export type TrackKey = (typeof TRACK_KEYS)[keyof typeof TRACK_KEYS];

export function isKnownTrackKey(v: string | null | undefined): v is TrackKey {
  if (!v) return false;
  return (Object.values(TRACK_KEYS) as string[]).includes(v);
}
