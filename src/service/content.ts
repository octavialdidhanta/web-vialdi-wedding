import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  Wrench,
  Camera,
  PenTool,
  Video,
  Film,
  Youtube,
  FileText,
  Instagram,
  Megaphone,
  Search,
  Target,
  Globe,
  MousePointerClick,
  Store,
  ShoppingBag,
} from "lucide-react";
import { isWeddingSite } from "@/site/siteVariant";

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
  /** Teks tombol konsultasi (emoji utama ditambahkan di `OurServicesPage`). */
  ctaLabel: string;
  /** Default 👉; bagian iklan memakai 👍 sesuai referensi. */
  ctaEmoji?: "👍";
};

const servicesHeroAgency = {
  /** Dikosongkan agar hero mengikuti referensi (tanpa pill eyebrow). */
  eyebrow: "",
  title: "WE ARE THE DIGITAL MARKETING AND CREATIVE AGENCY",
  subtitle: "Solusi digital end-to-end untuk kembangkan bisnis Anda",
} as const;

const servicesHeroWedding = {
  eyebrow: "Vialdi Wedding — Wedding Organizer",
  title: "KAMI MENGORGANISIR PERNIKAHAN ANDA DARI KONSEP HINGGA HARI BAHAGIA",
  subtitle:
    "Kami mendampingi perencanaan, menyelaraskan vendor yang relevan dengan acara Anda, dan mengawasi jalannya hari-H agar berjalan rapi sesuai kesepakatan.",
} as const;

export const servicesHero = isWeddingSite() ? servicesHeroWedding : servicesHeroAgency;

const serviceSectionsAgency: ServiceSection[] = [
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
      { title: "Pendaftaran Merek Dagang", icon: ShieldCheck },
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
      { title: "Jasa Foto Products", icon: Camera },
      { title: "Jasa Design Graphics", icon: PenTool },
      { title: "Jasa Video Editing", icon: Video },
      { title: "Jasa Video Shooting", icon: Film },
      { title: "Jasa Video Animasi", icon: Youtube },
      { title: "Jasa Penulisan Article Website", icon: FileText },
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
    ctaEmoji: "👍",
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

const serviceSectionsWedding: ServiceSection[] = [
  {
    id: "end-to-end",
    title: "Perencanaan & Organisasi End-to-End:",
    description: [
      "Pernikahan menyatukan banyak jadwal, keluarga, dan vendor. Tanpa penataan, detail kecil bisa mengganggu momen besar.",
      "Vialdi Wedding membantu merapikan konsep, anggaran kasar, komunikasi vendor, rundown, dan koordinasi di venue — supaya Anda tahu apa yang terjadi di setiap fase persiapan hingga resepsi.",
    ],
    fee: "Estimasi investasi — sesuai skala acara",
    items: [
      { title: "Konsultasi awal, konsep acara & gambaran anggaran", icon: Building2 },
      { title: "Kurasi & koordinasi vendor", icon: BadgeCheck },
      { title: "Rundown, protokol keluarga & briefing tim", icon: FileCheck2 },
      { title: "Pelaksanaan di venue mengikuti jadwal & rundown", icon: CalendarDays },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
  {
    id: "creative-social",
    title: "Dokumentasi, Dekorasi & Penampilan Pengantin:",
    description: [
      "Layanan ini mencakup hal yang banyak pasangan butuhkan langsung: dokumentasi foto dan video, tata ruang dan pelaminan, rias, serta sewa busana — biasanya dihubungkan dengan vendor mitra yang sudah terbiasa bekerja dengan tim kami.",
      "Rincian paket (durasi liputan, jumlah dekor, pilihan gaun, dll.) dibahas di awal agar sesuai budget dan venue Anda.",
    ],
    fee: "Paket disesuaikan — diskusi komponen",
    items: [
      { title: "Video cinematic & highlight resepsi", icon: Video },
      { title: "Foto prewedding & dokumentasi wedding day", icon: Camera },
      { title: "Desain undangan & stationery meja tamu", icon: PenTool },
      { title: "Dekorasi pelaminan & tata ruang utama", icon: Flower2 },
      { title: "Rias pengantin & penataan rambut (H+W)", icon: Sparkles },
      { title: "Sewa gaun, beskap & aksesori pelengkap", icon: Shirt },
      { title: "Editing video & penyusunan album digital", icon: Video },
      { title: "Montase / tayangan video singkat di resepsi", icon: Youtube },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
  {
    id: "ads",
    title: "Hidangan, Hiburan & Kenyamanan Tamu:",
    description: [
      "Selain dekor dan dokumentasi, acara resepsi membutuhkan hidangan yang pas, alur tamu yang jelas, dan pendukung seperti MC atau musik.",
      "Kami membantu merapatkan opsi bersama vendor mitra — bukan janji angka penjualan, melainkan penyelarasan kebutuhan porsi, waktu sajian, dan urutan acara di lapangan.",
    ],
    bullets: [
      "Penyelarasan menu, jumlah pax, dan waktu sajian dengan vendor catering.",
      "Bantuan konsep seating tamu keluarga dan meja utama sesuai protokol yang Anda inginkan.",
      "Koordinasi cek sound, mic, dan urutan hiburan ringan di resepsi.",
    ],
    fee: "Komponen opsional — sesuai pilihan",
    items: [
      { title: "MC, host & hiburan musik ringan", icon: Mic2 },
      { title: "Catering prasmanan & konsumsi tamu", icon: UtensilsCrossed },
      { title: "Wedding cake & stasiun dessert", icon: Cake },
      { title: "Saran rute, parkir & mobilitas tamu", icon: Car },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
  {
    id: "website",
    title: "Undangan & Informasi untuk Tamu:",
    description: [
      "Satu tautan undangan membantu tamu memahami jadwal, dress code, dan lokasi tanpa harus bertanya berulang ke mempelai.",
      "Jika Anda membutuhkannya, kami bisa menghubungkan Anda dengan pembuat halaman undangan sederhana (mobile-friendly) dan daftar kehadiran; lingkup teknis disepakati di awal.",
    ],
    fee: "Opsional — sesuai kebutuhan",
    items: [
      { title: "Halaman undangan online & ringkasan acara", icon: Globe },
      { title: "RSVP, daftar tamu & informasi praktis", icon: ClipboardList },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
  {
    id: "marketplace",
    title: "Koordinasi Vendor Mitra & Checklist Persiapan:",
    description: [
      "Pernikahan yang tenang biasanya punya satu benang merah: checklist yang jelas, siapa melakukan apa, dan kapan.",
      "Kami membantu Anda mengurai prioritas, menyusun daftar vendor, dan memastikan koordinasi berjalan rapi menjelang hari-H.",
    ],
    bullets: [
      "Checklist persiapan (H-90, H-30, H-7, H-1) yang bisa Anda ikuti.",
      "Pemetaan kebutuhan vendor sesuai venue dan skala tamu.",
      "Briefing singkat untuk vendor agar semua bergerak dalam alur yang sama.",
    ],
    fee: "Termasuk dalam pendampingan (sesuai scope)",
    items: [
      { title: "Checklist & timeline persiapan", icon: ClipboardList },
      { title: "Koordinasi vendor mitra", icon: Handshake },
      { title: "Pengingat jadwal penting", icon: CalendarDays },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
];

export const serviceSections: ServiceSection[] = isWeddingSite() ? serviceSectionsWedding : serviceSectionsAgency;

export const servicesCtas = {
  primaryHref: "/contact",
  primaryLabel: "Saya Ingin Konsultasi",
  secondaryHref: "/service",
  secondaryLabel: "Lihat layanan →",
};

export const servicesSeo = {
  title: "Layanan — vialdi.id | Digital marketing & creative agency",
  description:
    "Solusi end-to-end: perizinan & legalitas, creative & social media, iklan/ads, website, dan marketplace. Konsultasi via halaman kontak.",
};
