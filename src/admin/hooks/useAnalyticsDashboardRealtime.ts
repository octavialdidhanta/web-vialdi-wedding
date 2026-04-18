import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { supabase } from "@/share/supabaseClient";

/** Rows that mostly drive top paths / clicks; INSERT is enough. */
const ANALYTICS_INSERT_TABLES = ["analytics_page_views", "analytics_click_events"] as const;

/**
 * When Realtime is enabled for analytics tables (see migration), invalidate dashboard
 * aggregates as soon as new rows arrive. Falls back to refetchInterval on the query.
 *
 * `analytics_sessions` uses INSERT then UPDATE (session_touch on conflict). Acquisition
 * (UTM / landing) lives on sessions, so we listen to INSERT *and* UPDATE there — otherwise
 * only page_view/click INSERT would refresh the chart, same payload as Top 10 halaman.
 */
export function useAnalyticsDashboardRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const webId = getRequiredWebId();
    const channel = supabase.channel(`cms-analytics-dashboard-${webId}`);

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    };

    for (const table of ANALYTICS_INSERT_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table,
          filter: `web_id=eq.${webId}`,
        },
        invalidate,
      );
    }

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "analytics_sessions",
        filter: `web_id=eq.${webId}`,
      },
      invalidate,
    );

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
