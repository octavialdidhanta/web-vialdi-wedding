import { FileText, Link2, MessageCircle, Boxes, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/share/supabaseClient";
import { getCmsPropertySlug } from "@/share/cmsPropertySlug";
import { cn } from "@/share/lib/utils";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-navy",
  );

const SYNCKERJA_TRAFFIC_URL = "https://app.synckerja.com/digital-marketing/traffic";
const SYNCKERJA_LEADS_URL = "https://app.synckerja.com/omnichannel/leads";

export function AdminSidebar() {
  const cmsSlug = getCmsPropertySlug();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vialdi Wedding CMS
        </div>
        <div className="mt-2 space-y-1 text-left">
          <p className="truncate text-sm leading-snug text-navy" title={cmsSlug ?? undefined}>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Property
            </span>
            <span className="text-muted-foreground"> : </span>
            <span className="font-mono font-semibold">{cmsSlug ?? "—"}</span>
          </p>
          {!cmsSlug ? (
            <p className="text-[10px] leading-snug text-amber-800 dark:text-amber-200">
              Set <span className="font-mono">VITE_CMS_PROPERTY_SLUG</span> di env build.
            </p>
          ) : null}
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavLink to="/admin/posts" className={linkClass}>
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          Posts
        </NavLink>
        <NavLink to="/admin/packages" className={linkClass}>
          <Boxes className="h-4 w-4 shrink-0" aria-hidden />
          Paket
        </NavLink>
        <NavLink to="/admin/links" className={linkClass}>
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          Short link
        </NavLink>
        <NavLink to="/admin/whatsapp" className={linkClass}>
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          WhatsApp
        </NavLink>
        <div className="my-2 border-t border-border pt-2">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Synckerja
          </p>
          <a
            href={SYNCKERJA_TRAFFIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            Traffic
          </a>
          <a
            href={SYNCKERJA_LEADS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            Leads
          </a>
        </div>
      </nav>
      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          onClick={() => void supabase.auth.signOut()}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Keluar
        </button>
      </div>
    </aside>
  );
}
