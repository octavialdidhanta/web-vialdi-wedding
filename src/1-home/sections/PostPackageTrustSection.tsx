import { lazy, Suspense, type ReactNode } from "react";
import { usePackageConsultOpenerOptional } from "@/1-home/context/PackageConsultOpenerContext";
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
import garansiSealImage from "@/1-home/assets/Untitled design (4).png";
import { isWeddingSite } from "@/site/siteVariant";

const InstagramProfileEmbed = lazy(() =>
  import("@/1-home/sections/InstagramProfileEmbed").then((m) => ({ default: m.InstagramProfileEmbed })),
);

const triggerPurple =
  "rounded-lg bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-3 py-3.5 text-sm font-bold text-white shadow-sm hover:no-underline hover:opacity-95 data-[state=open]:rounded-b-none md:px-4 [&>svg]:text-white";

const contentMuted =
  "rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_295)] px-3 pb-4 pt-3 text-[0.8125rem] leading-relaxed text-muted-foreground data-[state=closed]:border-0 md:px-4";

const bookingRisks = [
  {
    id: "tanggal",
    title: "Slot vendor cepat penuh",
    body:
      "Tanggal bagus itu rebutan. Menunda 2–3 minggu bisa berarti tim yang Anda incar sudah ter-booking—akhirnya Anda terpaksa ambil yang tersisa, bukan yang paling cocok.",
  },
  {
    id: "kualitas",
    title: "Rundown jadi rapuh",
    body:
      "Tanpa rundown yang matang, jadwal mudah “geser-geser”: makeup molor, prosesi mundur, sesi foto kepotong. Efeknya merambat sampai acara selesai.",
  },
  {
    id: "rencana",
    title: "Koordinasi simpang-siur",
    body:
      "Semakin mepet, semakin banyak chat grup dan keputusan dadakan. PIC tidak jelas → info beda-beda → yang repot justru Anda dan keluarga.",
  },
  {
    id: "biaya",
    title: "Biaya dadakan naik",
    body:
      "Perubahan last-minute sering butuh biaya tambahan: overtime, add-on, transport, atau upgrade mendadak karena opsi yang tersisa lebih mahal.",
  },
  {
    id: "stres",
    title: "Momen penting terlewat",
    body:
      "First look, pelukan orang tua, foto keluarga—itu tidak bisa diulang. Kalau timing dan arahan tidak siap, momen bisa lewat begitu saja.",
  },
  {
    id: "review",
    title: "Hari H jadi tidak dinikmati",
    body:
      "Yang paling terasa saat persiapan mepet: Anda jadi sibuk ngurus, bukan menikmati. Padahal Anda berhak hadir sepenuhnya di hari paling penting.",
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
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] text-white"
        aria-hidden
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

/** Kartu pembuka narasi — di mobile bisa diposisikan tepat di bawah carousel paket (lihat HomePage). */
export function PostPackageTrustLeadCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-border bg-card/80 px-2.5 py-5 text-center shadow-sm md:mx-auto md:max-w-3xl md:p-8 md:text-left">
      <h3 className="text-lg font-bold text-navy md:text-xl">
        {title}
      </h3>
      <p className="mt-4 font-wedding-serif text-base italic leading-relaxed text-muted-foreground md:text-lg">
        {body}
      </p>
    </div>
  );
}

/** Narasi trust & urgensi — di desktop bagian atas mengikuti blok paket; di mobile kartu pembuka dipisah ke HomePage. */
export function PostPackageTrustSection({
  leadCard,
  showInstagram = true,
  showQuote = true,
  variant = "full",
}: {
  leadCard?: { title: string; body: string } | null;
  showInstagram?: boolean;
  showQuote?: boolean;
  variant?: "full" | "narrativeOnly" | "risksOnly" | "reasonsOnly";
}) {
  const packageConsultOpener = usePackageConsultOpenerOptional();
  const wedding = true;

  return (
    <div className="space-y-10 md:space-y-14">
      {leadCard ? (
        <div className="hidden md:block">
          <PostPackageTrustLeadCard title={leadCard.title} body={leadCard.body} />
        </div>
      ) : null}

      {variant !== "risksOnly" ? (
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(24rem,38rem)_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(26rem,42rem)_minmax(0,1fr)] lg:gap-10">
          {/* Mobile: narasi dulu; desktop: kolom kiri (kartu lebar seperti Garansi) */}
          <div className="min-w-0 md:col-start-1 md:row-start-1 md:self-stretch">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card px-4 py-5 shadow-md md:px-6 md:py-8">
              <div className="grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-8">
                <div>
                  <h3 className="text-lg font-bold text-navy md:text-xl">Faktanya</h3>
                  <ul className="mt-4 space-y-3">
                    <CheckRow>
                      {wedding
                        ? "Di hari H, yang Anda cari itu tenang. Tapi tanpa alur yang jelas, hal kecil cepat menumpuk: siapa datang jam berapa, siapa pegang keluarga, kapan momen inti diambil—ujungnya Anda malah kepikiran, bukan menikmati."
                        : "Menjalankan iklan itu mudah — yang sulit adalah membuat hasilnya stabil dan bisa diprediksi."}
                    </CheckRow>
                    <CheckRow>
                      {wedding
                        ? "Momen sakral itu sekali: akad, first kiss, pelukan orang tua, foto keluarga. Tanpa rundown + PIC yang tegas, momen bisa kepotong/kelewat—dan yang paling terasa: Anda baru sadar setelah acaranya selesai."
                        : "Tanpa tracking yang rapi, Anda tidak tahu apa yang benar-benar menghasilkan — budget habis tanpa insight."}
                    </CheckRow>
                    <CheckRow>
                      {wedding
                        ? "Dekor dan rias bisa cantik, tapi hasil yang “berasa mahal” datang dari eksekusi: arahan foto rapi, tempo acara enak, transisi mulus. Itu butuh tim yang satu suara—bukan sekadar vendor yang datang lalu pulang."
                        : "Creative dan funnel menentukan kualitas lead; budget hanya memperbesar apa yang sudah bekerja."}
                    </CheckRow>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy md:text-xl">Jika menunda mulai</h3>
                  <ul className="mt-4 space-y-3">
                    <CheckRow>
                      {wedding
                        ? "Mundur mulai = waktu koordinasi makin mepet. Detail teknis (akses venue, timeline makeup, titik kumpul keluarga, urutan foto) biasanya baru kebuka di akhir—dan di saat itu, opsi Anda tinggal “improvisasi”."
                        : "Anda kehilangan waktu untuk fase testing dan mengumpulkan baseline data."}
                    </CheckRow>
                    <CheckRow>
                      {wedding
                        ? "Kalau persiapan dikejar di menit terakhir, keputusan sering dibuat terburu-buru. Yang kena dampaknya bukan cuma Anda—keluarga ikut repot, dan momen yang seharusnya hangat jadi terasa “ngejar target”."
                        : "Masalah yang sama cenderung berulang: budget bocor, creative cepat burn, dan lead tidak stabil."}
                    </CheckRow>
                    <CheckRow>
                      {wedding
                        ? "Tanggal bagus cepat penuh, dan tim terbaik biasanya sudah terkunci duluan. Kalau menunda, Anda bukan memilih yang paling pas—tapi yang masih tersedia. Dan jujur: banyak pasangan menyesal karena ini baru terasa setelah lihat hasilnya."
                        : "Kompetitor yang lebih dulu optimasi biasanya mengunci audience & insight lebih cepat — biaya Anda bisa ikut naik."}
                    </CheckRow>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Garansi sejajar di kanan "Faktanya / Jika menunda mulai" */}
          <div className="hidden min-w-0 md:col-start-2 md:row-start-1 md:block">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-md md:p-8">
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
                Tenang — semuanya jelas dari awal. Jika hasil tidak sesuai kesepakatan tertulis (deliverable & standar yang
                disetujui), kami siapkan solusi yang adil sesuai kontrak — termasuk opsi pengembalian dana. Kami jaga
                kepercayaan Anda, karena hari H tidak bisa diulang.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Detail garansi, deliverable, dan syarat pembatalan tercantum di proposal &amp; kontrak resmi.
              </p>
              <div className="mt-6">
                <a
                  href="#paket-dokumentasi"
                  data-track={TRACK_KEYS.contactCta}
                  className="inline-flex rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      ) : null}

      {variant === "risksOnly" ? (
        <div className="min-w-0">
          <h3 className="text-center text-lg font-bold text-navy md:text-left md:text-xl">
            {wedding ? "Risiko yang sering muncul jika persiapan ditunda" : "Risiko yang sering muncul jika optimasi ditunda"}
          </h3>
          <Accordion
            type="single"
            collapsible
            defaultValue={bookingRisks[0]?.id}
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
      ) : null}

      {variant === "reasonsOnly" ? (
        <div className="min-w-0">
          <h3 className="mx-auto max-w-3xl text-center text-base font-bold leading-tight text-navy md:mx-0 md:text-left md:text-lg">
            Alasan memilih Vialdi Wedding
          </h3>
          <div className="mx-auto mt-3 grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:grid-cols-4 sm:gap-2 md:mx-0 md:max-w-none md:gap-2.5">
            {alasanItems.map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center shadow-sm md:rounded-xl md:px-2.5 md:py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[oklch(0.48_0.2_300)] shadow-sm md:h-11 md:w-11 md:rounded-xl">
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                </div>
                <p className="mt-2 text-[0.6875rem] font-medium leading-tight text-muted-foreground md:text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {variant === "full" ? (
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-start md:gap-8 lg:gap-10">
          {/* Kiri: Risiko */}
          <div className="min-w-0">
            <h3 className="text-center text-lg font-bold text-navy md:text-left md:text-xl">
              {wedding ? "Risiko yang sering muncul jika persiapan ditunda" : "Risiko yang sering muncul jika optimasi ditunda"}
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

          {/* Kanan: Alasan memilih */}
          <div className="min-w-0 md:flex md:h-full md:flex-col">
            <h3 className="mx-auto max-w-3xl text-center text-base font-bold leading-tight text-navy md:mx-0 md:text-left md:text-lg">
              Alasan memilih Vialdi Wedding
            </h3>
            <div className="mx-auto mt-3 grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:grid-cols-4 sm:gap-2 md:mx-0 md:max-w-none md:gap-2.5">
              {alasanItems.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center shadow-sm md:rounded-xl md:px-2.5 md:py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[oklch(0.48_0.2_300)] shadow-sm md:h-11 md:w-11 md:rounded-xl">
                    <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                  </div>
                  <p className="mt-2 text-[0.6875rem] font-medium leading-tight text-muted-foreground md:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {showQuote ? (
              <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card/80 px-4 py-5 text-center shadow-sm md:mx-0 md:mt-10 md:px-6 md:py-6">
                <p className="font-wedding-serif text-base italic leading-relaxed text-muted-foreground md:text-lg">
                  &ldquo;Bayangkan persiapan hari H terasa ringan: rundown rapi, koordinasi jelas, dan tim yang paham ritme
                  acara—jadi Anda tinggal fokus menikmati momen.&rdquo;
                </p>
              </div>
            ) : null}

            {/* Mobile: kartu Garansi diposisikan di bawah kutipan (desktop sudah dipindah ke atas) */}
            <div className="mt-8 flex flex-col rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-md md:hidden">
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
                Tenang — semuanya jelas dari awal. Jika hasil tidak sesuai kesepakatan tertulis (deliverable & standar yang
                disetujui), kami siapkan solusi yang adil sesuai kontrak — termasuk opsi pengembalian dana. Kami jaga
                kepercayaan Anda, karena hari H tidak bisa diulang.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Detail garansi, deliverable, dan syarat pembatalan tercantum di proposal &amp; kontrak resmi.
              </p>
              <div className="mt-6">
                <a
                  href="#paket-dokumentasi"
                  data-track={TRACK_KEYS.contactCta}
                  className="inline-flex rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      ) : null}

      {showInstagram ? (
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
      ) : null}
    </div>
  );
}
