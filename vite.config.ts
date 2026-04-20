import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { imagetools } from "vite-imagetools";

export default defineConfig(({ mode }) => {
  /** Paket `react-router` mengarahkan `exports` ke `dist/development/*` (bukan mode dev Node). Untuk produksi pakai artefak `dist/production/*` agar lebih ramping dan sumber map tidak berlabel "development". */
  const reactRouterProd = path.resolve(
    __dirname,
    "node_modules/react-router/dist/production",
  );
  /** Urutan penting: `react-router/dom` harus sebelum `react-router` agar tidak di-resolve ke `index.mjs/dom`. */
  const reactRouterAliasEntries =
    mode === "production"
      ? [
          {
            find: "react-router/dom",
            replacement: path.join(reactRouterProd, "dom-export.mjs"),
          },
          {
            find: "react-router",
            replacement: path.join(reactRouterProd, "index.mjs"),
          },
        ]
      : [];

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
    /**
     * Jangan `preconnect` ke Supabase di HTML awal: beranda tidak memanggil API Supabase di rantai kritis,
     * sehingga Lighthouse menandai preconnect sebagai tidak terpakai. `dns-prefetch` saja menghemat DNS
     * nanti (blog, formulir, analytics batch) tanpa membuka koneksi TLS dini.
     */
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
        /** Jika HTML masih berisi preconnect Supabase (template lama / edge), turunkan ke dns-prefetch agar PSI tidak menandai "unused preconnect". */
        name: "supabase-preconnect-to-dns-prefetch",
        transformIndexHtml: {
          order: "post",
          handler(html) {
            return html.replace(
              /<link\s+rel="preconnect"\s+href="(https:\/\/[^"]*supabase\.co)\/?"\s*([^>]*)\/?>/gi,
              (_full, origin: string, rest: string) => {
                const cleaned = rest.replace(/\s*crossorigin="[^"]*"/gi, "").trim();
                return `<link rel="dns-prefetch" href="${origin}"${cleaned ? ` ${cleaned}` : ""}>`;
              },
            );
          },
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
            /**
             * Lighthouse "LCP request discovery" membutuhkan URL kandidat LCP terlihat di HTML awal.
             * Hero di-render dari JS; satu `href` preload saja gagal jika browser memilih URL lain dari
             * `srcset` (ukuran file tidak selalu sejajar dengan lebar). Ambil string final dari chunk HomePage.
             * `imagesizes` harus sama dengan `sizes` di `HomePage.tsx` (hero `<img>`).
             */
            const heroImgSizes =
              "(max-width: 767px) calc(100vw - 1.25rem), (max-width: 1023px) calc(100vw - 3rem), min(560px, 46vw)";
            const chunk = Object.values(ctx.bundle).find(
              (c): c is { type: "chunk"; fileName: string; code: string } =>
                c.type === "chunk" &&
                typeof (c as { code?: string }).code === "string" &&
                (c as { code: string }).code.includes(
                  "Pasangan pengantin dalam suasana pernikahan elegan",
                ),
            );
            const code = chunk?.code;
            const heroUrls = code
              ? [...code.matchAll(/"(\/assets\/DSC00768_11zon[^"]*)"/g)].map((m) => m[1])
              : [];
            const imagesrcset = heroUrls.find((s) => /\d+w/.test(s));
            const hrefFromChunk = heroUrls.find((s) => !/\d+w/.test(s));
            if (!imagesrcset || !hrefFromChunk) {
              return html;
            }
            const tag = `    <link rel="preload" as="image" href="${hrefFromChunk}" imagesrcset="${imagesrcset}" imagesizes="${heroImgSizes}" fetchpriority="high" />\n`;
            const charsetMeta = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
            if (charsetMeta.test(html)) {
              return html.replace(charsetMeta, (m) => `${m}\n${tag}`);
            }
            return html.replace("</head>", `${tag}  </head>`);
          },
        },
      },
      {
        name: "async-build-stylesheets",
        transformIndexHtml: {
          order: "post",
          handler(html) {
            /** Hanya CSS hasil build (`/assets/*.css`); font eksternal dibiarkan seperti di `index.html`. */
            return html.replace(/<link\s+([^>]+)>/gi, (full, inner: string) => {
              if (!/\brel\s*=\s*["']stylesheet["']/i.test(inner)) return full;
              const href = /href\s*=\s*["']([^"']+)["']/i.exec(inner)?.[1];
              if (!href?.startsWith("/assets/") || !href.endsWith(".css")) return full;
              if (/\bmedia\s*=\s*["']print["']/i.test(inner) || /\bonload\s*=/.test(inner)) {
                return full;
              }
              const attrs = inner.trim();
              return `<link ${attrs} media="print" onload="this.media='all'">\n    <noscript><link ${attrs}></noscript>`;
            });
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
          /**
           * Kurangi "network dependency chain": gabungkan modul analytics (termasuk gtmDataLayer)
           * agar dynamic import tidak memicu banyak request kecil berantai.
           */
          manualChunks(id) {
            if (id.includes("/src/analytics/")) return "analytics";
            if (id.includes("/src/share/ui/")) return "ui";
            if (id.includes("node_modules/lucide-react")) return "icons";
            if (id.includes("node_modules/@radix-ui")) return "ui-vendor";
            if (id.includes("node_modules/react-router")) return "react-router";
          },
        },
      },
    },
    resolve: {
      alias: [
        ...reactRouterAliasEntries,
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
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
