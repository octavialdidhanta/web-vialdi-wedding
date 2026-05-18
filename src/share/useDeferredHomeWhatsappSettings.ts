import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchHomeFloatingWhatsappSettings,
  HOME_FLOATING_WHATSAPP_QUERY_KEY,
} from "@/share/homeFloatingWhatsappSettings";

/**
 * Muat pengaturan WA mengambang setelah idle — tidak ikut critical path beranda.
 * Butuh `QuerySectionProvider` di pohon React (lihat `HomePage`).
 */
export function useDeferredHomeWhatsappSettings() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const arm = () => setEnabled(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(arm, { timeout: 3500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(arm, 2000);
    return () => window.clearTimeout(t);
  }, []);

  return useQuery({
    queryKey: HOME_FLOATING_WHATSAPP_QUERY_KEY,
    queryFn: fetchHomeFloatingWhatsappSettings,
    enabled,
    staleTime: 60_000,
  });
}
