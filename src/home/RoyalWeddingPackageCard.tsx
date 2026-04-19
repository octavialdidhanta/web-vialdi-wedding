import { PackageCardPriceStack } from "@/home/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/home/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/home/PackagePromoMarquee";
import { ROYAL_WEDDING_GOLD_MARQUEE_PROMO_TEXT } from "@/home/royalWeddingGoldMarqueePromoText";
import { PackageBestSellerSeal } from "@/home/PackageBestSellerSeal";
import { PackageConsultLeadForm } from "@/home/PackageConsultLeadForm";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { PackageAccordionRoot } from "@/home/packageAccordionViewport";
import { PackagePricingCardShell } from "@/home/PackagePricingCardShell";

const sections = [
  {
    id: "photo",
    title: "Foto",
    intro:
      "Abadikan momen spesial Anda dengan tim ahli: dua fotografer profesional dan peralatan studio lengkap.",
    bullets: [
      "1 fotografer utama + 1 fotografer candid",
      "2 kamera profesional + lighting, flash, umbrella, tripod",
      "Sesi dokumentasi hingga 6 jam (sesuai paket)",
      "200 foto diedit + file dikirim via Google Drive & flashdisk",
      "Estimasi hasil foto utama 3 hari setelah acara untuk klien prioritas",
    ],
  },
  {
    id: "video",
    title: "Video sinematik",
    intro: "Cerita hari H dalam format film pendek yang emosional dan layak ditonton ulang.",
    bullets: [
      "1 videografer sinematik profesional",
      "1 kamera + tripod + gimbal stabilizer",
      "Highlight cinematic 2–5 menit (detail mengikuti paket)",
    ],
  },
  {
    id: "album",
    title: "Album kolase",
    intro: "Kenang momen terbaik dalam album yang awet dan enak dipegang.",
    bullets: ["1 album kolase / foto laminasi doff 22 halaman (sesuai spesifikasi paket)"],
  },
  {
    id: "bonus",
    title: "Bonus",
    intro: "Nilai tambah agar kenangan Anda lebih lengkap dan praktis.",
    bullets: [
      "Cinematic highlight ±30 detik untuk feed Instagram",
      "Cetak foto 4R + frame standar (sesuai promo berlaku)",
      "Flashdisk berisi master & hasil edit (sesuai promo berlaku)",
      "Ongkir pengiriman paket (sesuai promo & area)",
    ],
  },
  {
    id: "extra",
    title: "Extra bonus",
    intro: "Untuk paket tertentu — lebih banyak waktu, lebih banyak cerita.",
    bullets: ["Bonus tambahan durasi pemotretan +2 jam (mengikuti syarat paket)"],
  },
] as const;

/** Paket Royal — harga & isi paket tidak diubah dari versi sebelumnya. */
export function RoyalWeddingPackageCard() {
  return (
    <PackagePricingCardShell
      leadSummary={{
        badgeLabel: "Foto & video",
        packageName: "Royal Wedding Gold Premium + Album + Tim Profesional Ekstra",
        strikethroughPrice: "Rp 7.900.000",
        price: "Rp 5.500.000",
      }}
      header={
        <>
          <div className="flex min-h-0 grow flex-col">
            <p className="text-center">
              <span className="inline-block rounded-lg bg-[oklch(0.48_0.22_300)] px-3 py-2 text-xs md:px-4 font-bold uppercase tracking-wider text-white">
                Foto &amp; video
              </span>
            </p>
            <h2 className="mt-5 text-center text-lg font-bold leading-snug text-navy md:text-xl">
              Royal Wedding Gold Premium + Album + Tim Profesional Ekstra
            </h2>
          </div>
          <PackageCardPricePromoWrap
            priceArea={
              <PackageCardPriceStack leading={<PackageBestSellerSeal />}>
                <p className="text-sm text-muted-foreground line-through">Rp 7.900.000</p>
                <p className="text-3xl font-bold tracking-tight text-navy">Rp 5.500.000</p>
              </PackageCardPriceStack>
            }
            footNote={<PackagePromoMarquee text={ROYAL_WEDDING_GOLD_MARQUEE_PROMO_TEXT} />}
          />
        </>
      }
      accordion={
        <PackageAccordionRoot type="single" collapsible className="w-full space-y-2">
          {sections.map((s) => (
            <AccordionItem key={s.id} value={s.id} className="border-0">
              <AccordionTrigger className="rounded-lg bg-[oklch(0.48_0.22_300)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[oklch(0.36_0.19_300)] [&>svg]:text-white">
                {s.title}
              </AccordionTrigger>
              <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
                <p className="text-muted-foreground">{s.intro}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-foreground/90">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </PackageAccordionRoot>
      }
      footer={
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Total bonus mengikuti promo periode pemesanan. Detail pasti kami jelaskan saat konsultasi
          gratis.
        </p>
      }
      cta={
        <PackageConsultLeadForm packageLabel="Royal Wedding Gold Premium + Album + Tim Profesional Ekstra" />
      }
    />
  );
}
