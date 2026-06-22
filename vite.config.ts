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
  /** Judul bar statis FCP (index.html) — selaras Header Vialdi Wedding. */
  const fcpBrandHtml =
    '<span style="color:oklch(0.22 0.03 250)">Vialdi Wedding</span>';
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

  /** Hanya `/blog` (daftar): artikel `/blog/slug` sudah disuntik preconnect statis di Edge `api/blog-entry`. */
  const blogSupabasePreconnectScript = supabaseOrigin
    ? `<script>(function(){try{var p=location.pathname||"";if(p==="/blog"||p==="/blog/"){var l=document.createElement("link");l.rel="preconnect";l.href=${JSON.stringify(supabaseOrigin)};l.setAttribute("crossorigin","");document.head.appendChild(l);}}catch(e){}})();<\/script>`
    : "";

  return {
    plugins: [
      imagetools(),
      react(),
      tailwindcss(),
      {
        name: "inject-synckerja-config",
        transformIndexHtml(html) {
          const apiBase = env.VITE_SYNCKERJA_API_BASE?.trim() ?? "";
          const token = env.VITE_SYNCKERJA_SDK_TOKEN?.trim() ?? "";
          if (!apiBase && !token) return html;
          const configScript = `<script>window.SynckerjaConfig=${JSON.stringify({
            apiBase,
            token,
          })};</script>`;
          return html.replace("</body>", `    ${configScript}\n  </body>`);
        },
      },
      {
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
             * Lighthouse: LCP discovery + `<img>` sungguhan di HTML agar LCP tidak menunggu React.
             * `sizes` / srcset selaras `WeddingHeroSection.tsx`.
             */
            const heroImgSizes =
              "(max-width: 767px) calc(100vw - 1.25rem), (max-width: 1023px) calc(100vw - 3rem), min(560px, 46vw)";

            const staticHeroAlt = "Pasangan pengantin dalam suasana pernikahan elegan";

            const stripOldHeroPreloads = (h: string) =>
              h.replace(
                /<link[^>]*rel=["']preload["'][^>]*href=["'][^"']*DSC00768_11zon[^"']*["'][^>]*>\s*/gi,
                "",
              );

            let next = stripOldHeroPreloads(html);

            const stripHomeHeroPreloadIfBlog = `<script>(function(){if(/^\\/blog\\/.+/.test(location.pathname||"")){var e=document.getElementById("vialdi-fcp-home-hero-preload");if(e)e.remove();}})();<\/script>\n`;

            const injectPreloadAfterCharset = (h: string, href: string) => {
              const tag = `    <link id="vialdi-fcp-home-hero-preload" rel="preload" as="image" href="${href}" imagesizes="${heroImgSizes}" fetchpriority="high" />\n`;
              const charsetMeta = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
              if (charsetMeta.test(h)) {
                return h.replace(charsetMeta, (m) => `${m}\n${tag}${stripHomeHeroPreloadIfBlog}`);
              }
              return h.replace("</head>", `${tag}${stripHomeHeroPreloadIfBlog}  </head>`);
            };

            const buildImgTag = (src: string, srcset: string) =>
              `<img id="vialdi-static-hero-lcp" class="vialdi-static-hero-lcp" src="${src}" srcset="${srcset}" sizes="${heroImgSizes}" width="720" height="720" fetchpriority="high" decoding="async" alt="${staticHeroAlt}" />`;

            const homeHeroBootScript = (imgHtml: string) =>
              `<template id="vialdi-fcp-home-hero-tmpl">${imgHtml}</template><script>(function(){var p=location.pathname||"";var w=document.getElementById("vialdi-fcp-photo-wrap");var t=document.getElementById("vialdi-fcp-home-hero-tmpl");if(!w||!t)return;var blog=/^\\/blog\\/.+/.test(p);if(blog){var d=document.createElement("div");d.id="vialdi-fcp-blog-lcp-slot";d.className="vialdi-static-hero-lcp vialdi-fcp-blog-ph";d.setAttribute("aria-hidden","true");w.appendChild(d);}else{w.appendChild(t.content.cloneNode(true));}t.remove();})();<\/script>`;

            if (!ctx.bundle) {
              const dev640 = "/src/1-home/assets/hero/DSC00768_11zon.webp?w=640&format=webp";
              const dev960 = "/src/1-home/assets/hero/DSC00768_11zon.webp?w=960&format=webp";
              const dev1280 = "/src/1-home/assets/hero/DSC00768_11zon.webp?w=1280&format=webp";
              const dev1600 = "/src/1-home/assets/hero/DSC00768_11zon.webp?w=1600&format=webp";
              const devSrcset = `${dev640} 640w, ${dev960} 960w, ${dev1280} 1280w, ${dev1600} 1600w`;
              next = injectPreloadAfterCharset(next, dev960);
              return next.replaceAll(
                "__VIALDI_LCP_HERO_IMG__",
                homeHeroBootScript(buildImgTag(dev960, devSrcset)),
              );
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

            assetSizes.sort((a, b) => a.bytes - b.bytes);
            const widths = [640, 960, 1280, 1600] as const;
            const pairs = assetSizes.slice(0, 4).map((a, i) => ({
              href: `/${a.fileName.replace(/^\/+/, "")}`,
              w: widths[i] ?? 640 * (i + 1),
            }));
            const srcset = pairs.map((p) => `${p.href} ${p.w}w`).join(", ");
            const picked = assetSizes.length >= 2 ? assetSizes[1]! : assetSizes[0]!;
            const href = `/${picked.fileName.replace(/^\/+/, "")}`;
            const srcForImg = pairs[1]?.href ?? pairs[0]!.href;

            next = injectPreloadAfterCharset(next, href);
            return next.replaceAll(
              "__VIALDI_LCP_HERO_IMG__",
              homeHeroBootScript(buildImgTag(srcForImg, srcset)),
            );
          },
        },
      },
      {
        /** Produksi: rapatkan CSS kritis di <head> agar parse + tokenisasi lebih cepat (FCP). */
        name: "minify-fcp-critical-css",
        transformIndexHtml: {
          order: "post",
          handler(html) {
            return html.replace(
              /<style id="vialdi-fcp-critical">([\s\S]*?)<\/style>/i,
              (_full, css: string) => {
                const min = css
                  .replace(/\/\*[\s\S]*?\*\//g, "")
                  .replace(/\s+/g, " ")
                  .trim();
                return `<style id="vialdi-fcp-critical">${min}</style>`;
              },
            );
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
            /**
             * `trackRegistry` / `trackKeyUtils` ringan — jangan gabung dengan `sendAnalyticsBatch` + Supabase
             * agar halaman blog/header tidak memuat ~250 KiB analytics hanya untuk `TRACK_KEYS`.
             */
            if (id.includes("node_modules/lucide-react")) return "icons";
            if (id.includes("node_modules")) {
              const base = id.replace(/\\/g, "/");
              if (base.includes("@tiptap/") || base.includes("prosemirror-")) {
                return "tiptap-vendor";
              }
            }
            if (id.includes("/src/analytics/")) {
              if (id.includes("trackRegistry") || id.includes("trackKeyUtils")) {
                return undefined;
              }
              return "analytics";
            }
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
