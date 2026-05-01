/**
 * Bangun URL gambar cover yang lebih ringan untuk layar (Supabase Image Transformation).
 * Jika URL bukan object public Supabase, kembalikan as-is (CDN eksternal / asset lokal).
 *
 * Endpoint `/storage/v1/render/image/...` hanya jalan jika Image Transformations aktif
 * (biasanya Supabase Pro / pengaturan Storage). Di Free tier URL ini sering 404 → gambar putus.
 * Set `VITE_SUPABASE_IMAGE_TRANSFORM=true` di Vercel bila proyek Anda mendukung transform.
 */
const OBJECT_PUBLIC = "/storage/v1/object/public/";

function supabaseImageTransformEnabled(): boolean {
  const v = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORM;
  return v === "true" || v === "1";
}

export function buildSupabaseCoverRenderUrl(originalUrl: string, width: number): string | null {
  if (!supabaseImageTransformEnabled()) return null;
  try {
    const u = new URL(originalUrl);
    if (!u.hostname.endsWith(".supabase.co")) return null;
    const i = u.pathname.indexOf(OBJECT_PUBLIC);
    if (i === -1) return null;
    const rest = u.pathname.slice(i + OBJECT_PUBLIC.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);
    const objectPath = rest.slice(slash + 1);
    if (!objectPath) return null;
    const params = new URLSearchParams({
      width: String(width),
      quality: "82",
      format: "webp",
    });
    return `${u.origin}/storage/v1/render/image/public/${bucket}/${objectPath}?${params.toString()}`;
  } catch {
    return null;
  }
}

export type BlogCoverImgProps = {
  src: string;
  srcSet?: string;
  sizes: string;
};

function emptyCoverImgProps(): BlogCoverImgProps {
  return { src: "", sizes: "1px" };
}

/** Lebar untuk srcset — cukup untuk hero blog (mobile + desktop kolom kanan). */
const HERO_WIDTHS = [480, 720, 960, 1200] as const;

export function getBlogHeroCoverImgProps(originalUrl: string): BlogCoverImgProps {
  if (!originalUrl?.trim()) return emptyCoverImgProps();
  const base720 = buildSupabaseCoverRenderUrl(originalUrl, 720);
  if (!base720) {
    return {
      src: originalUrl,
      sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 36vw",
    };
  }
  const srcSet = HERO_WIDTHS.map((w) => {
    const url = buildSupabaseCoverRenderUrl(originalUrl, w);
    return url ? `${url} ${w}w` : null;
  })
    .filter(Boolean)
    .join(", ");
  return {
    src: buildSupabaseCoverRenderUrl(originalUrl, 960) ?? base720,
    srcSet,
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 36vw",
  };
}

/** Thumbnail daftar / sidebar — lebar kecil saja. */
export function getBlogThumbCoverSrc(originalUrl: string, width = 140): string {
  if (!originalUrl?.trim()) return "";
  return buildSupabaseCoverRenderUrl(originalUrl, width) ?? originalUrl;
}

const CARD_WIDTHS = [360, 480, 640] as const;
const FEATURED_CARD_WIDTHS = [480, 720, 960, 1200] as const;
/** List /blog: mobile thumbnail lebar + desktop kotak sempit (satu img, `sizes` hybrid). */
const LIST_ROW_WIDTHS = [200, 360, 480, 640] as const;
const LIST_FEATURED_WIDTHS = [240, 400, 560, 720] as const;

/** Kartu daftar blog — resolusi lebih kecil dari hero. */
export function getBlogCardCoverImgProps(
  originalUrl: string,
  opts?: { featured?: boolean; list?: boolean },
): BlogCoverImgProps {
  if (!originalUrl?.trim()) return emptyCoverImgProps();
  if (opts?.list) {
    const large = Boolean(opts?.featured);
    const widths = large ? LIST_FEATURED_WIDTHS : LIST_ROW_WIDTHS;
    const defaultW = large ? 400 : 360;
    const base = buildSupabaseCoverRenderUrl(originalUrl, defaultW);
    const sizes = large
      ? "(max-width: 767px) 100vw, 192px"
      : "(max-width: 767px) 100vw, 176px";
    if (!base) {
      return { src: originalUrl, sizes };
    }
    const srcSet = widths
      .map((w) => {
        const url = buildSupabaseCoverRenderUrl(originalUrl, w);
        return url ? `${url} ${w}w` : null;
      })
      .filter(Boolean)
      .join(", ");
    return {
      src: buildSupabaseCoverRenderUrl(originalUrl, defaultW) ?? base,
      srcSet,
      sizes,
    };
  }

  const widths = opts?.featured ? FEATURED_CARD_WIDTHS : CARD_WIDTHS;
  const defaultW = opts?.featured ? 960 : 480;
  const base = buildSupabaseCoverRenderUrl(originalUrl, defaultW);
  const sizes = opts?.featured
    ? "(max-width: 640px) 100vw, (max-width: 1536px) min(90rem, 100vw), 1440px"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
  if (!base) {
    return {
      src: originalUrl,
      sizes,
    };
  }
  const srcSet = widths
    .map((w) => {
      const url = buildSupabaseCoverRenderUrl(originalUrl, w);
      return url ? `${url} ${w}w` : null;
    })
    .filter(Boolean)
    .join(", ");
  return {
    src: buildSupabaseCoverRenderUrl(originalUrl, defaultW) ?? base,
    srcSet,
    sizes,
  };
}
