import { createRoot } from "react-dom/client";
import {
  installSynckerjaConfigFromEnv,
  installSynckerjaTrackLeadGlobal,
} from "@/analytics/synckerjaApi";
import App from "./App";

export function bootApp(): void {
  installSynckerjaConfigFromEnv();
  installSynckerjaTrackLeadGlobal();

  const root = document.getElementById("root");
  if (!root) return;
  createRoot(root).render(<App />);
}
