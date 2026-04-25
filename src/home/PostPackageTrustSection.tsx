import { lazy, Suspense, type ReactNode } from "react";
import { usePackageConsultOpenerOptional } from "@/home/PackageConsultOpenerContext";
import {
  Camera,
  Check,
  Lightbulb,
  Plane,
  ShieldCheck,
  ThumbsUp,
  UserSearch,
  Users,
} from "lucide-react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import garansiSealImage from "@/home/assets/Untitled design (4).png";

const InstagramProfileEmbed = lazy(() =>
  import("@/home/InstagramProfileEmbed").then((m) => ({ default: m.InstagramProfileEmbed })),
);

const triggerPurple =
  "rounded-lg bg-accent-orange px-3 py-3.5 text-sm font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-accent-orange md:px-4 [&>svg]:text-white";

const contentMuted =
  "rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] leading-relaxed text-muted-foreground data-[state=closed]:border-0 md:px-4";

const bookingRisks = [
  {
    id: "tanggal",
    title: "Budget cepat habis",
    body:
      "Tanpa optimasi rutin, budget mudah “bocor” ke placement/audience yang kurang efektif. Akhirnya CPA/CPL naik dan learning susah stabil.",
  },
  {
    id: "kualitas",
    title: "Tracking tidak rapi",
    body:
      "Tanpa event/pixel/UTM yang benar, Anda tidak tahu apa yang sebenarnya menghasilkan. Keputusan jadi berdasarkan feeling, bukan data.",
  },
  {
    id: "rencana",
    title: "Creative cepat burn",
    body:
      "Kalau tidak ada cadence testing kreatif, performa biasanya turun pelan-pelan. CTR turun, CPM naik, hasil ikut melemah.",
  },
  {
    id: "biaya",
    title: "Funnel bocor",
    body:
      "Iklan sudah jalan, tapi landing page/WA/form tidak siap. Prospek drop di tengah jalan dan cost per lead jadi mahal.",
  },
  {
    id: "stres",
    title: "Kejar-kejaran deadline",
    body:
      "Mulai terburu-buru membuat setup tidak rapi dan banyak revisi mendadak. Tim habis waktu di teknis, bukan di optimasi hasil.",
  },
  {
    id: "review",
    title: "Tidak ada playbook",
    body:
      "Tanpa dokumentasi insight, masalah yang sama terulang. Padahal yang Anda butuh: pola yang bisa dipakai ulang untuk scale.",
  },
] as const;

const alasanItems = [
  { label: "Tim berpengalaman", Icon: Users },
  { label: "Respons cepat", Icon: Plane },
  { label: "Kualitas terjaga", Icon: Check },
  { label: "Pelayanan ramah", Icon: ThumbsUp },
  { label: "Transparan", Icon: UserSearch },
  { label: "Peralatan pro", Icon: Camera },
  { label: "Konsep kreatif", Icon: Lightbulb },
  { label: "Garansi nilai", Icon: ShieldCheck },
] as const;

function CheckRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-foreground/90 md:text-[0.9375rem]">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-orange text-white"
        aria-hidden
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

/** Kartu pembuka narasi — di mobile bisa diposisikan tepat di bawah carousel paket (lihat HomePage). */
export function PostPackageTrustLeadCard() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/80 px-3 py-5 text-center shadow-sm md:p-8 md:text-left">
      <h3 className="text-lg font-bold text-navy md:text-xl">&ldquo;vialdi.id&rdquo; solusinya</h3>
      <p className="mt-4 font-wedding-serif text-base italic leading-relaxed text-muted-foreground md:text-lg">
        Paket yang jelas deliverable-nya, optimasi yang terukur, dan komunikasi yang rapi — supaya
        Anda bisa fokus closing, bukan bingung teknis.
      </p>
    </div>
  );
}

/** Narasi trust & urgensi — di desktop bagian atas mengikuti blok paket; di mobile kartu pembuka dipisah ke HomePage. */
export function PostPackageTrustSection() {
  const packageConsultOpener = usePackageConsultOpenerOptional();

  return (
    <div className="space-y-10 md:space-y-14">
      <div className="hidden md:block">
        <PostPackageTrustLeadCard />
      </div>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(24rem,38rem)_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(26rem,42rem)_minmax(0,1fr)] lg:gap-10">
        {/* Mobile: narasi dulu; desktop: kolom kiri (kartu lebar seperti Garansi) */}
        <div className="min-w-0 md:col-start-1 md:row-start-1 md:self-stretch">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card px-4 py-5 shadow-md md:px-6 md:py-8">
            <div className="grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg font-bold text-navy md:text-xl">Faktanya</h3>
                <ul className="mt-4 space-y-3">
                  <CheckRow>
                    Menjalankan iklan itu mudah — yang sulit adalah membuat hasilnya stabil dan bisa
                    diprediksi.
                  </CheckRow>
                  <CheckRow>
                    Tanpa tracking yang rapi, Anda tidak tahu apa yang benar-benar menghasilkan —
                    budget habis tanpa insight.
                  </CheckRow>
                  <CheckRow>
                    Creative dan funnel menentukan kualitas lead; budget hanya memperbesar apa yang
                    sudah bekerja.
                  </CheckRow>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy md:text-xl">Jika menunda mulai</h3>
                <ul className="mt-4 space-y-3">
                  <CheckRow>
                    Anda kehilangan waktu untuk fase testing dan mengumpulkan baseline data.
                  </CheckRow>
                  <CheckRow>
                    Masalah yang sama cenderung berulang: budget bocor, creative cepat burn, dan lead
                    tidak stabil.
                  </CheckRow>
                  <CheckRow>
                    Kompetitor yang lebih dulu optimasi biasanya mengunci audience & insight lebih
                    cepat — biaya Anda bisa ikut naik.
                  </CheckRow>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: di bawah narasi; desktop: kolom kanan — grid 3×2 tanpa scroll area */}
        <div className="min-w-0 md:col-start-2 md:row-start-1">
          <h3 className="text-center text-lg font-bold text-navy md:text-left md:text-xl">
            Risiko yang sering muncul jika optimasi ditunda
          </h3>
          <Accordion
            type="single"
            collapsible
            className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-2.5"
          >
            {bookingRisks.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-0">
                <AccordionTrigger className={triggerPurple}>{item.title}</AccordionTrigger>
                <AccordionContent className={contentMuted}>
                  <p>{item.body}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(24rem,38rem)_minmax(0,1fr)] md:items-stretch md:gap-8 lg:grid-cols-[minmax(26rem,42rem)_minmax(0,1fr)] lg:gap-10">
        {/* Mobile: alasan dulu; desktop: kolom kanan (Tim berpengalaman di kiri area grid) */}
        <div className="min-w-0 md:col-start-2 md:row-start-1 md:flex md:h-full md:flex-col md:self-stretch">
          <h3 className="mx-auto max-w-3xl text-center text-base font-bold leading-tight text-navy md:mx-0 md:text-left md:text-lg">
            Alasan memilih vialdi.id
          </h3>
          <div className="mx-auto mt-3 grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:grid-cols-4 sm:gap-2 md:mx-0 md:max-w-none md:gap-2.5">
            {alasanItems.map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center shadow-sm md:rounded-xl md:px-2.5 md:py-3"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent-orange shadow-sm md:h-11 md:w-11 md:rounded-xl"
                >
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                </div>
                <p className="mt-2 text-[0.6875rem] font-medium leading-tight text-muted-foreground md:text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: di bawah alasan; desktop: kolom kiri, sejajar kartu Tim berpengalaman */}
        <div className="mx-auto w-full max-w-lg md:col-start-1 md:row-start-1 md:mx-0 md:max-w-none">
          <blockquote className="mx-auto mb-6 max-w-3xl text-center font-wedding-serif text-lg italic leading-relaxed text-muted-foreground md:mb-8 md:text-xl">
            &ldquo;Bayangkan setiap minggu Anda tahu apa yang bekerja, apa yang tidak, dan langkah apa
            yang harus dilakukan untuk menaikkan leads.&rdquo;
          </blockquote>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-md md:p-8">
            <img
              src={garansiSealImage}
              alt="Garansi 100% uang kembali"
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="mx-auto h-auto w-36 max-w-full object-contain sm:w-44 md:w-60"
            />
            <h3 className="mt-5 text-lg font-bold text-navy md:mt-6 md:text-xl">
              Garansi kepuasan &amp; transparansi
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Jika layanan tidak memenuhi kesepakatan tertulis yang disetujui bersama, kami diskusikan
              solusi adil — termasuk opsi pengembalian dana sesuai kontrak. vialdi.id
              mengutamakan kepercayaan jangka panjang, bukan janji kosong.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Detail garansi dan syarat pembatalan tercantum di proposal &amp; kontrak resmi.
            </p>
            <div className="mt-6">
              <a
                href="#paket-dokumentasi"
                data-track={TRACK_KEYS.contactCta}
                className="inline-flex rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                onClick={(e) => {
                  if (packageConsultOpener) {
                    e.preventDefault();
                    packageConsultOpener.requestOpenAllPackageConsults();
                  }
                }}
              >
                Amankan slot konsultasi
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram (full width, sejajar header) */}
      <div className="md:col-span-2">
        <Suspense
          fallback={
            <div
              className="min-h-[440px] animate-pulse rounded-2xl border border-border bg-muted/35 motion-reduce:animate-none md:min-h-[680px]"
              aria-hidden
            />
          }
        >
          <InstagramProfileEmbed variant="compact" contained={false} />
        </Suspense>
      </div>
    </div>
  );
}
