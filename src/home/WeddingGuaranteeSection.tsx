import { Check } from "lucide-react";

const guarantees = [
  "Target & KPI jelas sejak awal (lead, CPL/CPA, ROAS, atau revenue).",
  "Setup tracking rapi: pixel, event, UTM, dan dashboard laporan.",
  "Optimasi rutin berbasis data: testing kreatif, audience, dan landing page.",
  "Budget transparan + rekomendasi alokasi untuk hasil maksimal.",
  "Konten & copy fokus konversi—bukan sekadar engagement.",
  "Komunikasi cepat, update progres terjadwal, dan next action selalu jelas.",
  "A/B test yang terstruktur, dengan catatan insight yang bisa dipakai ulang.",
  "Quality control sebelum scale: cek funnel, form/WA, dan respon tim sales.",
  "Komitmen layanan: jika deliverable tidak sesuai kesepakatan, kami revisi atau evaluasi solusi sesuai kontrak.",
];

export function WeddingGuaranteeSection() {
  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-4 py-6 shadow-sm backdrop-blur-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
        <h2 className="font-wedding-serif text-2xl font-bold text-navy md:text-3xl">
          Janji vialdi.id
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Bukan janji manis — ini standar kerja yang kami pegang untuk menjaga performa dan
          akuntabilitas.
        </p>

        <ul className="mt-6 grid max-w-3xl gap-3 md:mt-10 md:block md:space-y-4">
          {guarantees.map((line) => (
            <li
              key={line}
              className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-sm leading-relaxed shadow-[0_1px_0_rgba(0,0,0,0.04)] md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:text-base"
            >
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                style={{ background: "var(--accent-orange)" }}
                aria-hidden
              />
              <span className="flex-1 text-foreground/90">{line}</span>
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-accent-orange/35 bg-accent-orange text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] md:shadow-none"
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
