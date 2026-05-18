import { NavLink } from "react-router-dom";
import { Boxes, FileText, Inbox, LayoutDashboard, Link2, LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/share/supabaseClient";
import { cn } from "@/share/lib/utils";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-navy",
  );

function adminWebId(): string | null {
  const raw = (import.meta.env.VITE_WEB_ID as string | undefined)?.trim();
  return raw?.length ? raw : null;
}

export function AdminSidebar() {
  const webId = adminWebId();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vialdi Wedding
        </div>
        <div className="mt-2 space-y-1 text-left">
          <p className="truncate text-sm leading-snug text-navy" title={webId ?? undefined}>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Web ID
            </span>
            <span className="text-muted-foreground"> : </span>
            <span className="font-mono font-semibold">{webId ?? "—"}</span>
          </p>
          {!webId ? (
            <p className="text-[10px] leading-snug text-amber-800 dark:text-amber-200">
              Set <span className="font-mono">VITE_WEB_ID</span> di env build.
            </p>
          ) : null}
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavLink to="/admin/dashboard" className={linkClass} end>
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          Dashboard
        </NavLink>
        <NavLink to="/admin/requests" className={linkClass}>
          <Inbox className="h-4 w-4 shrink-0" aria-hidden />
          Request
        </NavLink>
        <NavLink to="/admin/leads" className={linkClass}>
          <Inbox className="h-4 w-4 shrink-0" aria-hidden />
          Leads Hub
        </NavLink>
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
