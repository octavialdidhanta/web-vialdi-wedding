import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function schedulePlayfairFonts(): void {
  const load = () => {
    void import("@fontsource/playfair-display/600.css");
    void import("@fontsource/playfair-display/700.css");
  };

  if (typeof window === "undefined") {
    load();
    return;
  }

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(load, { timeout: 2500 });
    return;
  }

  window.addEventListener("load", () => window.setTimeout(load, 0), { once: true });
}

schedulePlayfairFonts();

createRoot(document.getElementById("root")!).render(<App />);
