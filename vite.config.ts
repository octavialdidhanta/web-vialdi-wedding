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
      {
        name: "preload-lcp-hero-image",
        transformIndexHtml: {
          order: "post",
          handler(html, ctx) {
            if (!ctx.bundle) {
              return html;
            }
            const key = Object.keys(ctx.bundle).find(
              (k) => k.includes("DSC00768_11zon") && k.endsWith(".webp"),
            );
            if (!key) {
              return html;
            }
            const href = key.startsWith("/") ? key : `/${key}`;
            const tag = `    <link rel="preload" as="image" href="${href}" fetchpriority="high" />\n`;
            const charsetMeta = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
            if (charsetMeta.test(html)) {
              return html.replace(charsetMeta, (m) => `${m}\n${tag}`);
            }
            return html.replace("</head>", `${tag}  </head>`);
          },
        },
      },
    ],
    build: {
      /** Hindari .map besar di produksi (deploy lebih ringan, PSI lebih bersih). */
      sourcemap: mode !== "production",
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
