import { isWeddingSite } from "@/site/siteVariant";

const contactSeoAgency = {
  title: "Kontak — Vialdi.ID | Konsultasi strategi & pemasaran digital",
  description:
    "Hubungi Vialdi.ID untuk konsultasi: strategi brand, iklan berbayar, konten, dan optimasi konversi. Form singkat — tim kami akan menghubungi Anda melalui kanal yang disepakati.",
} as const;

const contactSeoWedding = {
  title: "Kontak — Vialdi Wedding | Konsultasi dokumentasi & paket pernikahan",
  description:
    "Konsultasi awal Vialdi Wedding gratis & tanpa tekanan. Form 2 langkah: kontak dulu, lalu perkiraan jadwal & lokasi. Privasi dijaga — hanya untuk follow-up, tanpa spam.",
} as const;

export const contactSeo = isWeddingSite() ? contactSeoWedding : contactSeoAgency;
