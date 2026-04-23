import { useEffect } from "react";
import { useParams } from "react-router-dom";

const SLUG_RE = /^[a-z0-9-]{3,64}$/i;

/**
 * Dev / fallback: Vite tidak menjalankan `api/shortlink-redirect`. Di production Vercel,
 * rewrite `/l/:slug` biasanya menangkap dulu; route ini cadangan bila rewrite tidak aktif.
 */
export function ShortLinkOutboundRedirect() {
  const { slug } = useParams();

  useEffect(() => {
    if (!slug || !SLUG_RE.test(slug)) return;
    const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!base?.trim()) return;
    const url = `${base.replace(/\/+$/, "")}/functions/v1/link-redirect?slug=${encodeURIComponent(slug.toLowerCase())}`;
    window.location.replace(url);
  }, [slug]);

  if (!slug || !SLUG_RE.test(slug)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p>Short link tidak valid.</p>
        <a href="/" className="text-primary underline">
          Ke beranda
        </a>
      </div>
    );
  }

  if (!import.meta.env.VITE_SUPABASE_URL?.trim()) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p>
          Set <code className="rounded bg-muted px-1 font-mono text-xs">VITE_SUPABASE_URL</code> di{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">.env</code> untuk menguji{" "}
          <code className="font-mono text-xs">/l/…</code> secara lokal.
        </p>
        <a href="/" className="text-primary underline">
          Ke beranda
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Mengalihkan…
    </div>
  );
}
