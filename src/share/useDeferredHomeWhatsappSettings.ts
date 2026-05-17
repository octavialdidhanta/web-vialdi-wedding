import { useEffect, useState } from "react";
import {
  fetchHomeFloatingWhatsappSettings,
  type HomeFloatingWhatsappSettingsRow,
} from "@/share/homeFloatingWhatsappSettings";

/** Fetch WA beranda setelah idle — tanpa React Query di cold start. */
export function useDeferredHomeWhatsappSettings() {
  const [data, setData] = useState<HomeFloatingWhatsappSettingsRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void fetchHomeFloatingWhatsappSettings()
        .then((row) => {
          if (!cancelled) {
            setData(row);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsLoading(false);
        });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(load, { timeout: 5000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(load, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return { data, isLoading };
}
