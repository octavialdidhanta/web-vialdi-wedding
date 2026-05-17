import { createRoot } from "react-dom/client";
import App from "./App";

export function bootApp(): void {
  const root = document.getElementById("root");
  if (!root) return;
  createRoot(root).render(<App />);
}
