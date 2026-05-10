import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { supabase } from "@/share/supabaseClient";

/** Rows that drive dashboard aggregates / charts; INSERT is enough. */
const ANALYTICS_INSERT_TABLES = ["analytics_page_views", "analytics_click_events"] as const;

/**
 * When Realtime is enabled for analytics tables (see migration), invalidate dashboard
 * queries as soon as new rows arrive (raw events). Refetches `admin_analytics_summary`,
 * `get_traffic_dashboard`, and click-detail modals for the current web.
 *
 * `analytics_sessions` uses INSERT then UPDATE (session_touch on conflict). Acquisition
 * (UTM / landing) lives on sessions, so we listen to INSERT *and* UPDATE there — otherwise
 * only page_view/click INSERT would refresh charts tied to page views / clicks.
 *
 * Rollup harian (`analytics_daily_*`) tetap bisa tertinggal sampai job refresh; angka mentah
 * dari RPC berbasis event akan tetap ikut bergerak via invalidasi ini.
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
      void queryClient.invalidateQueries({ queryKey: ["admin", "traffic-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "click-breakdown"] });
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
