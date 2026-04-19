import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { imagetools } from "vite-imagetools";

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
    /** dns-prefetch saja: preconnect ke Supabase sering dianggap "unused" di PSI jika request belum awal. */
    supabaseOrigin ? `<link rel="dns-prefetch" href="${supabaseOrigin}">` : "",
    `<link rel="dns-prefetch" href="https://www.googletagmanager.com">`,
  ]
    .filter(Boolean)
    .join("\n    ");

  return {
    plugins: [
      imagetools(),
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
            /** Beberapa lebar (`?w=480;720;…`) menghasilkan banyak file; `src` hero memakai w=720 (varian kedua terkecil). */
            const heroSizes = Object.values(ctx.bundle)
              .filter(
                (c): c is { type: "asset"; fileName: string; source: string | Uint8Array } =>
                  c.type === "asset" &&
                  c.fileName.includes("DSC00768_11zon") &&
                  c.fileName.endsWith(".webp"),
              )
              .map((c) => {
                const src = c.source;
                const bytes =
                  typeof src === "string" ? Buffer.byteLength(src) : src.byteLength;
                return { fileName: c.fileName, bytes };
              })
              .sort((a, b) => a.bytes - b.bytes);
            const pick = heroSizes[Math.min(1, Math.max(0, heroSizes.length - 1))];
            if (!pick) {
              return html;
            }
            const hrefNorm = pick.fileName.startsWith("/")
              ? pick.fileName
              : `/${pick.fileName}`;
            const tag = `    <link rel="preload" as="image" href="${hrefNorm}" fetchpriority="high" />\n`;
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
      /**
       * Source map untuk bundle produksi: membantu debug + memuaskan Lighthouse
       * ("Missing source maps for large first-party JavaScript"). Pastikan file
       * `*.js.map` ikut di-deploy ke folder `assets/` yang sama dengan chunk JS.
       *
       * `sourcemapExcludeSources`: map lebih kecil (tanpa inline `sourcesContent`);
       * stack trace tetap ke file/line asli jika path ada di map.
       */
      sourcemap: true,
      rollupOptions: {
        output: {
          sourcemapExcludeSources: true,
        },
      },
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
