const PACKAGE_BUCKET = "package-media";

function supabaseOriginFromEnv(): string | null {
  const raw = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/**
 * Public URL untuk object storage Supabase tanpa meng-import `@supabase/supabase-js`.
 * Dipakai oleh UI kartu paket agar bundle beranda tidak membawa client Supabase hanya untuk `getPublicUrl`.
 */
export function resolvePackageStoragePublicUrl(
  path: string | null | undefined,
  url: string | null | undefined,
): string | null {
  const u = url?.trim();
  if (u) return u;

  const p = path?.trim();
  if (!p) return null;

  const origin = supabaseOriginFromEnv();
  if (!origin) return null;

  const cleaned = p.replace(/^\/+/, "");
  return `${origin}/storage/v1/object/public/${PACKAGE_BUCKET}/${cleaned}`;
}
