import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  BadgeCheck,
  Building2,
  FileCheck2,
  Camera,
  Video,
  PencilLine,
  PenTool,
  Instagram,
  MousePointerClick,
  PhoneCall,
  ShoppingBag,
  Search,
  Youtube,
  Globe,
  Target,
  Store,
  Wrench,
} from "lucide-react";

/** Satu kartu layanan di halaman Service; `detailHref` opsional untuk tombol Lihat Detail. */
export type ServiceOfferItem = {
  title: string;
  icon: LucideIcon;
  detailHref?: string;
};

export type ServiceSection = {
  id: string;
  title: string;
  description?: string[];
  bullets?: string[];
  fee: string;
  items: ServiceOfferItem[];
  ctaLabel: string;
};

export const servicesHero = {
  eyebrow: "Layanan Digital Marketing Vialdi.ID",
  title: "WE ARE THE DIGITAL MARKETING AND CREATIVE AGENCY",
  subtitle: "Solusi digital end-to-end untuk kembangkan bisnis Anda",
};

export const serviceSections: ServiceSection[] = [
  {
    id: "end-to-end",
    title: "Solusi End to End Agency:",
    description: [
      "Perusahaan baru seringkali menghadapi kesulitan ketika memulai bisnis dan perizinan.",
      "vialdi.id membantu menangani segalanya mulai dari permohonan BPOM, Merek dagang (brand), Legalitas bisnis (Akta Perusahaan, NIB, NPWP), dan perizinan lainnya",
    ],
    fee: "Agency Fee Start From 2,8jt",
    items: [
      { title: "Pembuatan PT Perorangan", icon: Building2 },
      { title: "Pendaftaran Merek Dagang", icon: BadgeCheck },
      { title: "Permohonan BPOM", icon: FileCheck2 },
      { title: "Perizinan Lainnya", icon: Wrench },
    ],
    ctaLabel: "Saya Ingin Konsultasi",
  },
  {
    id: "creative-social",
    title: "Creative & Social Media:",
    description: [
      "Untuk memperkenalkan produk atau jasa secara efektif, diperlukan konten yang profesional dan menarik.",
      "Vialdi.ID siapkan content yang menarik dan siap viral untuk brand anda:",
    ],
    fee: "Agency Fee Start From 350rb",
    items: [
      { title: "Jasa Video Products", icon: Video },
      { title: "Jasa Foto Products", icon: Camera },
      { title: "Jasa Design Graphics", icon: PenTool },
      { title: "Jasa Video Editing", icon: Video },
      { title: "Jasa Video Shooting", icon: Video },
      { title: "Jasa Video Animasi", icon: Youtube },
      { title: "Jasa Penulisan Article Website", icon: PencilLine },
      { title: "Social Media Management", icon: Instagram },
    ],
    ctaLabel: "Saya Ingin Konsultasi",
  },
  {
    id: "ads",
    title: "Iklan/ Ads/ Campaign:",
    description: [
      "Dengan menggabungkan konten berkualitas dan strategi pemasaran yang efektif, Anda dapat memperluas jangkauan dan meningkatkan interaksi dengan menggunakan jasa iklan di vialdi.id.",
      "Kami bantu optimalkan iklan anda agar tepat sasaran dan tidak boncos:",
    ],
    bullets: [
      "fitur Direct Phone Call / WhatsApp sehingga anda mendapatkan calon pelanggan potensial.",
      "fitur direct to shopee/ Tokopedia sehingga pelanggan bisa langsung checkout di ecommerce anda.",
      "Tayangan iklan google search ads anda akan muncul di urutan teratas halaman satu google",
    ],
    fee: "Agency Fee Start From 3jt",
    items: [
      { title: "Jasa Iklan TikTok Ads", icon: Megaphone },
      { title: "Iklan Google Search Ads", icon: Search },
      { title: "Iklan Google Display Ads", icon: Target },
      { title: "Jasa Iklan Facebook & IG", icon: Instagram },
    ],
    ctaLabel: "Saya Ingin Konsultasi",
  },
  {
    id: "website",
    title: "Website:",
    description: [
      "Penting untuk Memiliki Website. Taruhkan iklan Anda langsung ke website untuk memberikan informasi mendalam tentang produk atau layanan Anda kepada calon pelanggan.",
      "Kami Bantu Buat Website yang menghasilkan Konversi.",
    ],
    fee: "Agency Fee Start From 1,5jt",
    items: [
      { title: "Jasa Pembuatan Website", icon: Globe },
      { title: "Jasa Optimasi SEO Website", icon: MousePointerClick },
    ],
    ctaLabel: "Saya Ingin Konsultasi",
  },
  {
    id: "marketplace",
    title: "Marketplace:",
    description: [
      "Setelah pengunjung diberi pemahaman dan manfaat melalui situs web, mereka dapat diarahkan langsung ke platform marketplace.",
      "Jangan asal buka toko!, Toko Online juga butuh Riset dan Optimasi.",
      "Kami Bantu Pembuatan Marketplace dan Optimasi dengan cara yang benar sampai menghasilkan penjualan.",
    ],
    fee: "Agency Fee Start From 2,5jt",
    items: [
      { title: "Jasa Pembuatan Marketplace", icon: Store },
      { title: "Jasa Optimasi Marketplace", icon: ShoppingBag },
    ],
    ctaLabel: "Saya Ingin Konsultasi",
  },
];

export const servicesCtas = {
  primaryHref: "/contact",
  primaryLabel: "Saya Ingin Konsultasi",
  secondaryHref: "/service",
  secondaryLabel: "Diskusi Kebutuhan →",
};
