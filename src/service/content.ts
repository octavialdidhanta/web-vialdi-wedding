import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  FileCheck2,
  Camera,
  Video,
  PenTool,
  Youtube,
  Globe,
  Store,
  Flower2,
  Sparkles,
  Shirt,
  Mic2,
  UtensilsCrossed,
  Cake,
  Car,
  ClipboardList,
  Handshake,
  CalendarDays,
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
  eyebrow: "Vialdi Wedding — Wedding Organizer",
  title: "KAMI MENGORGANISIR PERNIKAHAN ANDA DARI KONSEP HINGGA HARI BAHAGIA",
  subtitle:
    "Kami mendampingi perencanaan, menyelaraskan vendor yang relevan dengan acara Anda, dan mengawasi jalannya hari-H agar berjalan rapi sesuai kesepakatan.",
};

export const serviceSections: ServiceSection[] = [
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
    title: "Katalog & Rekomendasi Vendor Mitra:",
    description: [
      "Kami memelihara daftar vendor mitra (foto, rias, dekor, catering, dll.) yang sudah pernah bekerja dalam alur Vialdi Wedding. Tujuannya mempercepat pencocokan gaya dan jadwal, bukan menjual “slot iklan”.",
      "Anda tetap memutuskan paket dan kontrak langsung dengan vendor; kami membantu menjembatani komunikasi awal dan jadwal meeting bila diperlukan.",
    ],
    fee: "Referensi mitra — tanpa biaya tersembunyi di katalog",
    items: [
      { title: "Referensi vendor sesuai tema & anggaran", icon: Store },
      { title: "Pendampingan jadwal trial & pertemuan awal", icon: Handshake },
    ],
    ctaLabel: "Diskusi dengan Wedding Planner",
  },
];

export const servicesCtas = {
  primaryHref: "/contact",
  primaryLabel: "Jadwalkan konsultasi",
  secondaryHref: "/service",
  secondaryLabel: "Lihat layanan →",
};

export const servicesSeo = {
  title: "Layanan Wedding Organizer — Vialdi Wedding",
  description:
    "Organisasi pernikahan Vialdi Wedding: perencanaan end-to-end, dokumentasi & dekor, rias dan sewa gaun, hidangan & hiburan tamu, undangan online, serta rekomendasi vendor mitra. Konsultasi via halaman kontak.",
};
