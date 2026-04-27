import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/share/supabaseClient";
import { adminCheckIsCmsAdmin } from "@/blog/agencySupabaseBlog";

type AdminAuthState = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refreshAdmin: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthState | null>(null);

function useAdminRobotsMeta() {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      return;
    }
    let meta = document.querySelector(
      'meta[name="robots"][data-admin="1"]',
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      meta.setAttribute("data-admin", "1");
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "noindex,nofollow";
    return () => {
      if (prev) {
        meta!.content = prev;
      } else {
        meta?.remove();
      }
    };
  }, [location.pathname]);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useAdminRobotsMeta();

  const refreshAdmin = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(await adminCheckIsCmsAdmin(uid));
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session ?? null);
      void refreshAdmin(data.session?.user.id).finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      setLoading(true);
      void refreshAdmin(sess?.user.id).finally(() => setLoading(false));
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshAdmin]);

  const value = useMemo<AdminAuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      loading,
      refreshAdmin: async () => {
        await refreshAdmin(session?.user.id);
      },
    }),
    [session, isAdmin, loading, refreshAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

/** Hook konteks admin (bukan komponen) — dikecualikan dari aturan react-refresh. */
// eslint-disable-next-line react-refresh/only-export-components -- hook + provider satu modul
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
