/** Hapus blok paragraf tersembunyi dari HTML sebelum disimpan (data-public="false"). */
export function stripHiddenFromBodyHtml(html: string): string {
  if (typeof document === "undefined") {
    return html;
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  wrap.querySelectorAll('[data-public="false"]').forEach((el) => el.remove());
  wrap.querySelectorAll("[data-label]").forEach((el) => el.removeAttribute("data-label"));
  wrap.querySelectorAll("[data-locked]").forEach((el) => el.removeAttribute("data-locked"));
  return wrap.innerHTML;
}
