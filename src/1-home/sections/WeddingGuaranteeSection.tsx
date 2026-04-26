import { Check } from "lucide-react";

const guaranteesWedding = [
  "Konsultasi awal yang jernih: tanggal, venue, dan kebutuhan paket dirangkum rapi.",
  "Koordinasi tim & vendor: alur komunikasi jelas supaya hari H tidak penuh kejutan.",
  "Rundown & titik penting dibahas di awal (akad, resepsi, family photo, highlight).",
  "Tim datang tepat waktu dan briefing singkat sebelum momen utama dimulai.",
  "Quality control hasil: file tersusun rapi, proses seleksi & edit sesuai kesepakatan paket.",
  "Transparansi add-on & biaya: pilihan jelas tanpa “tiba-tiba nambah” di tengah jalan.",
  "Komunikasi responsif: update progres dan timeline pengerjaan dibagikan apa adanya.",
  "Komitmen layanan: jika deliverable tidak sesuai kesepakatan tertulis, kami evaluasi & cari solusi adil sesuai kontrak.",
];

export function WeddingGuaranteeSection() {
  const guarantees = guaranteesWedding;
  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-4 py-6 shadow-sm backdrop-blur-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
        <h2 className="font-wedding-serif text-2xl font-bold text-navy md:text-3xl">
          Komitmen kami
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Bukan janji manis — ini standar kerja yang kami pegang supaya persiapan dan hari H terasa tenang.
        </p>

        <ul className="mt-6 grid max-w-3xl gap-3 md:mt-10 md:block md:space-y-4">
          {guarantees.map((line) => (
            <li
              key={line}
              className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-sm leading-relaxed shadow-[0_1px_0_rgba(0,0,0,0.04)] md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:text-base"
            >
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                style={{ background: "oklch(0.48 0.2 300)" }}
                aria-hidden
              />
              <span className="flex-1 text-foreground/90">{line}</span>
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[oklch(0.48_0.2_300)]/25 bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] md:shadow-none"
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
