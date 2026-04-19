import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  let supabaseOrigin = "";
  try {
    const u = env.VITE_SUPABASE_URL?.trim();
    if (u) {
      supabaseOrigin = new URL(u).origin;
    }
  } catch {
    // ignore invalid URL
  }

  const originHints = [
    supabaseOrigin ? `<link rel="preconnect" href="${supabaseOrigin}" crossorigin>` : "",
    `<link rel="dns-prefetch" href="https://www.googletagmanager.com">`,
  ]
    .filter(Boolean)
    .join("\n    ");

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "inject-origin-hints",
        transformIndexHtml(html) {
          return html.replace("<head>", `<head>\n    ${originHints}`);
        },
      },
    ],
    build: {
      /** Peta sumber publik: Lighthouse "Best practices" tidak mengeluh file besar tanpa .map */
      sourcemap: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
  };
});
