/** Dispatched after `#vialdi-fcp-shell` is hidden so hero can adopt static LCP img. */
export const VIALDI_FCP_SHELL_REMOVED = "vialdi-fcp-shell-removed";

let removed = false;

export function removeVialdiFcpShell(): void {
  if (typeof document === "undefined") return;
  if (removed) return;

  document.body.classList.add("vialdi-app-ready");
  const shell = document.getElementById("vialdi-fcp-shell");
  if (shell) {
    shell.remove();
  }

  removed = true;
  document.dispatchEvent(new CustomEvent(VIALDI_FCP_SHELL_REMOVED));
}
