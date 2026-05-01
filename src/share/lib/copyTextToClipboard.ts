/**
 * Fallback sinkron (masih dalam user gesture) — penting untuk Safari iOS.
 */
function tryExecCommandCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "0";
    ta.style.top = "0";
    ta.style.width = "2em";
    ta.style.height = "2em";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0";
    ta.setAttribute("tabindex", "-1");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Menyalin teks: dulu execCommand (gesture-friendly), lalu Clipboard API.
 */
export function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if (tryExecCommandCopy(text)) return Promise.resolve(true);

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  }

  return Promise.resolve(false);
}
