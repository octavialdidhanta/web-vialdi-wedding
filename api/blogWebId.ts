const WEB_ID_SLUG_RE = /^[a-z0-9-]{3,64}$/;

/** Property slug for blog edge routes (must match frontend `VITE_WEB_ID`). */
export function getEdgeWebId(): string {
  const raw = (process.env.VITE_WEB_ID ?? process.env.WEB_ID ?? "").trim();
  if (!raw || !WEB_ID_SLUG_RE.test(raw)) {
    throw new Error("VITE_WEB_ID or WEB_ID must be set for blog edge routes");
  }
  return raw;
}
