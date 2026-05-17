import "./index.css";

function scheduleAppBoot(): void {
  const run = () => void import("./boot").then((m) => m.bootApp());

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

function schedulePlayfairFonts(): void {
  const load = () => {
    void import("@fontsource/playfair-display/600.css");
    void import("@fontsource/playfair-display/700.css");
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(load, { timeout: 5000 });
    return;
  }

  window.addEventListener("load", () => window.setTimeout(load, 0), { once: true });
}

schedulePlayfairFonts();
scheduleAppBoot();
