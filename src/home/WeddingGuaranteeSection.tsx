import { Check } from "lucide-react";

const guarantees = [
  "Garansi kepuasan klien — kami mendengarkan dan menyesuaikan hasil dengan ekspektasi Anda.",
  "Garansi kualitas foto: resolusi tinggi, warna konsisten, siap cetak & album.",
  "Garansi kualitas video sinematik dengan grading yang matang.",
  "Garansi kualitas album laminasi dan jilid rapi.",
  "Paket dengan harga transparan dan komunikasi jelas sejak awal.",
  "Retouch wajah natural — tekstur kulit halus tanpa efek plastik berlebihan.",
  "Revisi editing wajar sesuai kesepakatan agar hasil benar-benar milik Anda.",
  "Bimbingan pose agar terlihat percaya diri dan harmonis di setiap frame.",
  "Komitmen layanan: jika kesepakatan tertulis tidak terpenuhi, diskusi solusi atau pengembalian sesuai kontrak.",
];

export function WeddingGuaranteeSection() {
  return (
    <div className="min-w-0">
      <h2 className="font-wedding-serif text-2xl font-bold text-navy md:text-3xl">
        Janji Vialdi Wedding
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
        Kualitas bukan sekadar janji di kertas — ini ringkasan nilai yang kami pegang dalam setiap
        proyek.
      </p>

      <ul className="mt-10 max-w-3xl space-y-4">
        {guarantees.map((line) => (
          <li key={line} className="flex gap-3 text-sm leading-relaxed md:text-base">
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full"
              style={{ background: "oklch(0.48 0.18 300)" }}
              aria-hidden
            />
            <span className="flex-1 text-foreground/90">{line}</span>
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[oklch(0.42_0.14_300)]/35 bg-[oklch(0.45_0.16_300)] text-white"
              aria-hidden
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
