export const VIALDI_FCP_SHELL_REMOVED = "vialdi-fcp-shell-removed";

/** Lepas overlay HTML statis setelah hero siap — LCP sudah dari gambar/judul di HTML. */
export function removeVialdiFcpShell(): void {
  const shell = document.getElementById("vialdi-fcp-shell");
  if (!shell) return;
  document.body.classList.add("vialdi-app-ready");
  shell.remove();
  document.dispatchEvent(new Event(VIALDI_FCP_SHELL_REMOVED));
}
