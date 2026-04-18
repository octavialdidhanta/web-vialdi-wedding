import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/share/supabaseClient";

const ANALYTICS_TABLES = [
  "analytics_page_views",
  "analytics_sessions",
  "analytics_click_events",
] as const;

/**
 * When Realtime is enabled for analytics tables (see migration), invalidate dashboard
 * aggregates as soon as new rows arrive. Falls back to refetchInterval on the query.
 */
export function useAnalyticsDashboardRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase.channel("cms-analytics-dashboard");

    for (const table of ANALYTICS_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
        },
      );
    }

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn(
          "[analytics] Realtime subscribe error — pastikan migrasi analytics_realtime sudah dijalankan dan Realtime aktif di project Supabase.",
        );
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
