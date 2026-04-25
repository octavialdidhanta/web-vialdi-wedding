import { isWeddingSite } from "@/site/siteVariant";

const contactSeoAgency = {
  title: "Kontak — Vialdi.ID | Konsultasi strategi & pemasaran digital",
  description:
    "Hubungi Vialdi.ID untuk konsultasi: strategi brand, iklan berbayar, konten, dan optimasi konversi. Form singkat — tim kami akan menghubungi Anda melalui kanal yang disepakati.",
} as const;

const contactSeoWedding = {
  title: "Kontak — Vialdi Wedding | Konsultasi dokumentasi & paket pernikahan",
  description:
    "Hubungi Vialdi Wedding untuk konsultasi gratis: dokumentasi foto & video, album, dan paket pernikahan. Form singkat 2 langkah — data kontak lalu jadwal & lokasi acara.",
} as const;

export const contactSeo = isWeddingSite() ? contactSeoWedding : contactSeoAgency;
