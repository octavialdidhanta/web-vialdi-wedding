/** Opsi form konsultasi agensi (Vialdi.ID) — langkah 2 & 3. */

export const AGENCY_BIDANG_USAHA_OPTIONS = [
  "F&B (Makanan & Minuman)",
  "Fashion",
  "Kesehatan",
  "Pendidikan",
  "Properti",
  "Otomotif",
  "Jasa Profesional",
  "Teknologi",
  "Kecantikan",
  "Manufaktur",
  "UMKM",
  "Lainnya",
] as const;

export type AgencyBusinessType = "B2B" | "B2C";

export const AGENCY_JABATAN_OPTIONS = ["Brand Owner", "Brand Manager", "Marketing Lead", "Founder / CEO", "Lainnya"] as const;

export const AGENCY_KEBUTUHAN_OPTIONS = [
  "Branding (Social Media)",
  "Iklan / Ads",
  "Website",
  "Marketplace",
  "Lainnya",
] as const;

/** Gabungan untuk kolom `event_address` / arsip notifikasi (maks. 8000 karakter). */
export function buildAgencyEventAddressBlock(args: {
  bidang: string;
  jenis: string;
  jabatan: string;
  kebutuhan: string;
  office: string;
  ringkasan: string;
}): string {
  const lines = [
    `Bidang usaha: ${args.bidang}`,
    `Jenis usaha: ${args.jenis}`,
    `Jabatan: ${args.jabatan}`,
    `Kebutuhan utama: ${args.kebutuhan}`,
    "",
    `Alamat kantor / domisili:\n${args.office}`,
    "",
    "Ringkasan kebutuhan:",
    args.ringkasan,
  ];
  return lines.join("\n").slice(0, 8000);
}
