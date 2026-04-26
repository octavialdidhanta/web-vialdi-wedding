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
  /** Judul bar statis FCP (index.html) — selaras Header wedding vs agency. */
  const fcpBrandHtml =
    env.VITE_WEB_ID === "vialdi"
      ? '<span style="color:oklch(0.22 0.03 250)">vialdi</span><span style="color:oklch(0.72 0.13 55)">.id</span>'
      : '<span style="color:oklch(0.22 0.03 250)">Vialdi Wedding</span>';
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
     * Supabase: `dns-prefetch` untuk semua rute (ringan). `preconnect` TLS hanya untuk /blog/* lewat skrip
     * setelah charset (lihat plugin `blog-supabase-preconnect`) agar PSI tidak menandai preconnect tak terpakai di beranda.
     */
    supabaseOrigin ? `<link rel="dns-prefetch" href="${supabaseOrigin}">` : "",
    `<link rel="dns-prefetch" href="https://www.googletagmanager.com">`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const blogSupabasePreconnectScript = supabaseOrigin
    ? `<script>(function(){try{var p=location.pathname||"";if(p==="/blog"||p==="/blog/"||p.indexOf("/blog/")===0){var l=document.createElement("link");l.rel="preconnect";l.href=${JSON.stringify(supabaseOrigin)};l.setAttribute("crossorigin","");document.head.appendChild(l);}}catch(e){}})();<\/script>`
    : "";

  return {
    plugins: [
      imagetools(),
      react(),
      tailwindcss(),
      {
        name: "inject-fcp-brand",
        transformIndexHtml(html) {
          if (!html.includes("__VIALDI_FCP_BRAND__")) return html;
          return html.replaceAll("__VIALDI_FCP_BRAND__", fcpBrandHtml);
        },
      },
      {
        name: "inject-origin-hints",
        transformIndexHtml(html) {
          return html.replace("<head>", `<head>\n    ${originHints}`);
        },
      },
      {
        name: "blog-supabase-preconnect",
        transformIndexHtml(html) {
          if (!blogSupabasePreconnectScript) return html;
          return html.replace(
            /(<meta\s+charset=["']UTF-8["']\s*\/?>)/i,
            `$1\n    ${blogSupabasePreconnectScript}`,
          );
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
            /**
             * Lighthouse "LCP request discovery" membutuhkan URL kandidat LCP terlihat di HTML awal.
             * Hero di-render dari JS; hash file hasil build berubah tiap deploy — ambil URL final dari
             * artefak Rollup (`ctx.bundle`) supaya preload selalu cocok tanpa edit manual `index.html`.
             *
             * `imagesizes` harus sama dengan `sizes` di `WeddingHeroSection.tsx` (hero `<img>`).
             */
            const heroImgSizes =
              "(max-width: 767px) calc(100vw - 1.25rem), (max-width: 1023px) calc(100vw - 3rem), min(560px, 46vw)";

            const stripOldHeroPreloads = (h: string) =>
              h.replace(
                /<link[^>]*rel=["']preload["'][^>]*href=["'][^"']*DSC00768_11zon[^"']*["'][^>]*>\s*/gi,
                "",
              );

            let next = stripOldHeroPreloads(html);

            if (!ctx.bundle) {
              const devHref = "/src/1-home/assets/hero/DSC00768_11zon.webp?w=960&format=webp";
              const tag = `    <link rel="preload" as="image" href="${devHref}" imagesizes="${heroImgSizes}" fetchpriority="high" />\n`;
              const charsetMeta = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
              if (charsetMeta.test(next)) {
                return next.replace(charsetMeta, (m) => `${m}\n${tag}`);
              }
              return next.replace("</head>", `${tag}  </head>`);
            }

            const assetSizes = Object.values(ctx.bundle)
              .filter((o) => o.type === "asset" && /DSC00768_11zon.*\.webp$/i.test(o.fileName))
              .map((o) => {
                const buf = o.source instanceof Uint8Array ? o.source : null;
                const str = typeof o.source === "string" ? o.source : "";
                const bytes = buf?.byteLength ?? (str ? new TextEncoder().encode(str).byteLength : 0);
                return { fileName: o.fileName, bytes };
              });

            if (!assetSizes.length) {
              return next;
            }

            /**
             * Ada beberapa varian WebP (hasil `vite-imagetools` dengan `?w=` berbeda).
             * Preload varian **kedua terkecil** (~960w): cocok untuk slot hero mobile (DPR 2–3) tanpa
             * unduhan 1280/1600 yang berlebihan; hindari preload 640w yang sering di-upgrade browser.
             */
            assetSizes.sort((a, b) => a.bytes - b.bytes);
            const picked = assetSizes.length >= 2 ? assetSizes[1]! : assetSizes[0]!;
            const href = `/${picked.fileName.replace(/^\/+/, "")}`;

            const tag = `    <link rel="preload" as="image" href="${href}" imagesizes="${heroImgSizes}" fetchpriority="high" />\n`;
            const charsetMeta = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
            if (charsetMeta.test(next)) {
              return next.replace(charsetMeta, (m) => `${m}\n${tag}`);
            }
            return next.replace("</head>", `${tag}  </head>`);
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
            if (id.includes("node_modules/lucide-react")) return "icons";
            /**
             * Jangan gabungkan semua Radix ke satu chunk.
             * Home butuh `react-accordion`, tapi Select/Menu/ScrollArea hanya dipakai di area lain (admin/forms).
             * Memisah mengurangi "unused JS" untuk rute beranda.
             */
            if (id.includes("node_modules/@radix-ui/react-accordion")) return "radix-accordion";
            if (id.includes("node_modules/@radix-ui/react-select")) return "radix-select";
            if (id.includes("node_modules/@radix-ui/react-menubar")) return "radix-menubar";
            if (id.includes("node_modules/@radix-ui/react-scroll-area")) return "radix-scroll-area";
            /**
             * Hindari `radix-core` catch-all: Lighthouse sering menandai banyak "unused JS"
             * karena satu chunk memuat banyak paket Radix/Floating UI yang tidak dipakai di rute beranda.
             */
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
