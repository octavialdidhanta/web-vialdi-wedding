import type { ReactNode } from "react";
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

const GARANSI_SEAL_IMAGE =
  "https://jasafotowedding.com/wp-content/uploads/2021/06/garansi.png";

const triggerPurple =
  "rounded-lg bg-[oklch(0.48_0.22_300)] px-3 py-3.5 text-sm font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[oklch(0.36_0.19_300)] md:px-4 [&>svg]:text-white";

const contentMuted =
  "rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] leading-relaxed text-muted-foreground data-[state=closed]:border-0 md:px-4";

const bookingRisks = [
  {
    id: "tanggal",
    title: "Ketersediaan tanggal",
    body:
      "Fotografer wedding berkualitas jadwalnya padat. Menunda booking berarti risiko tanggal favorit sudah terisi klien lain — sehingga Anda perlu berkompromi pada waktu atau pilihan vendor.",
  },
  {
    id: "kualitas",
    title: "Kualitas fotografer",
    body:
      "Vendor terbukti biasanya habis lebih dulu. Jika booking mepet, Anda mungkin terpaksa memilih tim yang belum Anda riset mendalam, atau gaya kerjanya belum selaras dengan visi Anda.",
  },
  {
    id: "rencana",
    title: "Rencana kurang matang",
    body:
      "Pra-wedding meeting, rundown, dan konsep butuh waktu. Menunda berarti ruang diskusi lebih sempit — risiko miskomunikasi detail yang berujung pada hasil yang kurang optimal.",
  },
  {
    id: "biaya",
    title: "Biaya tambahan",
    body:
      "Beberapa vendor menerapkan biaya penahanan tanggal atau perubahan jadwal. Semakin dekat hari H, semakin tinggi potensi biaya mendadak yang sebenarnya bisa dihindari dengan booking lebih awal.",
  },
  {
    id: "stres",
    title: "Stres persiapan",
    body:
      "Pernikahan sudah penuh checklist. Menunda dokumentasi menambah beban mental: mencari slot, membandingkan portofolio, dan cemas tidak dapat tim yang cocok di waktu yang tersisa.",
  },
  {
    id: "review",
    title: "Review & referensi",
    body:
      "Tanpa ulasan klien atau referensi jelas, sulit memprediksi chemistry dan profesionalisme di lapangan. Booking lebih awal memberi waktu untuk cek portofolio, testimoni, dan konsultasi tanpa terburu-buru.",
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
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.48_0.22_300)] text-white"
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
      <h3 className="text-lg font-bold text-navy md:text-xl">&ldquo;Vialdi Wedding&rdquo; solusinya</h3>
      <p className="mt-4 font-wedding-serif text-base italic leading-relaxed text-muted-foreground md:text-lg">
        Dengan paket di bawah 10 juta, kami berkomitmen menghadirkan standar foto, komunikasi, dan
        pengalaman layanan yang setara spirit vendor dokumentasi papan atas — tanpa melewati
        transparansi harga di awal.
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

      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(24rem,38rem)_minmax(0,1fr)] md:items-stretch md:gap-8 lg:grid-cols-[minmax(26rem,42rem)_minmax(0,1fr)] lg:gap-10">
        {/* Mobile: narasi dulu; desktop: kolom kiri (kartu lebar seperti Garansi) */}
        <div className="min-w-0 md:col-start-1 md:row-start-1 md:self-stretch">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card px-4 py-5 shadow-md md:px-6 md:py-8">
            <div className="grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg font-bold text-navy md:text-xl">Faktanya</h3>
                <ul className="mt-4 space-y-3">
                  <CheckRow>
                    Kita tidak pernah tahu kapan bisa kembali ke tempat yang sama dengan suasana yang
                    sama.
                  </CheckRow>
                  <CheckRow>
                    Momen berharga tidak mengulang sendiri — merekalah yang membuat hari ini berarti
                    untuk esok hari.
                  </CheckRow>
                  <CheckRow>
                    Mengabadikan pernikahan secara profesional adalah cara menghormati cerita Anda:
                    agar bisa dikenang jelas, jujur, dan indah ketika rambut sudah memutih.
                  </CheckRow>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy md:text-xl">Jika melewatkan promo terbuka</h3>
                <ul className="mt-4 space-y-3">
                  <CheckRow>
                    Harga dan bundling bonus dapat berubah setelah periode promo ditutup.
                  </CheckRow>
                  <CheckRow>Benefit promo yang sedang berjalan tidak otomatis diperpanjang.</CheckRow>
                  <CheckRow>Kami tidak menjamin promo serupa tersedia di musim berikutnya.</CheckRow>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: di bawah narasi; desktop: kolom kanan — grid 3×2 tanpa scroll area */}
        <div className="min-w-0 md:col-start-2 md:row-start-1">
          <h3 className="text-center text-lg font-bold text-navy md:text-left md:text-xl">
            Risiko yang sering muncul jika booking tanggal ditunda
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
        <div className="min-w-0 md:col-start-2 md:row-start-1">
          <h3 className="mx-auto max-w-3xl text-center text-base font-bold leading-tight text-navy md:mx-0 md:text-left md:text-lg">
            Alasan memilih dokumentasi di Vialdi Wedding
          </h3>
          <div className="mx-auto mt-3 grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:grid-cols-4 sm:gap-2 md:mx-0 md:max-w-none md:gap-2.5">
            {alasanItems.map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center shadow-sm md:rounded-xl md:px-2.5 md:py-3"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm md:h-11 md:w-11 md:rounded-xl"
                  style={{
                    background: "linear-gradient(165deg, oklch(0.72 0.1 300), oklch(0.48 0.22 300))",
                  }}
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
        <div className="mx-auto w-full max-w-lg md:col-start-1 md:row-start-1 md:mx-0 md:max-w-none md:self-stretch">
          <blockquote className="mx-auto mb-6 max-w-3xl text-center font-wedding-serif text-lg italic leading-relaxed text-muted-foreground md:mb-8 md:text-xl">
            &ldquo;Bayangkan setiap kali merayakan anniversary, Anda dapat menyaksikan kembali keajaiban
            pernikahan melalui koleksi foto yang kami abadikan dengan penuh perhatian.&rdquo;
          </blockquote>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card px-3 py-5 text-center shadow-md md:p-8">
            <img
              src={GARANSI_SEAL_IMAGE}
              alt="Garansi 100% uang kembali"
              width={220}
              height={220}
              loading="lazy"
              decoding="async"
              className="mx-auto h-auto w-40 max-w-full object-contain sm:w-44 md:w-48"
            />
            <h3 className="mt-6 text-lg font-bold text-navy md:text-xl">Garansi kepuasan &amp; transparansi</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Jika layanan tidak memenuhi kesepakatan tertulis yang disetujui bersama, kami diskusikan
              solusi adil — termasuk opsi pengembalian dana sesuarkan kontrak. Vialdi Wedding
              mengutamakan kepercayaan jangka panjang, bukan janji kosong.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Detail garansi dan syarat pembatalan tercantum di proposal &amp; kontrak resmi.
            </p>
            <div className="mt-6 md:mt-auto md:pt-4">
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
    </div>
  );
}
