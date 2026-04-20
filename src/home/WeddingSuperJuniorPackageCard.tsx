import { PackageCardPriceStack } from "@/home/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/home/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/home/PackagePromoMarquee";
import { PackageConsultLeadForm } from "@/home/PackageConsultLeadForm";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { PackageAccordionRoot } from "@/home/packageAccordionViewport";
import { PackagePricingCardShell } from "@/home/PackagePricingCardShell";
import { usePromoCountdown } from "@/home/usePromoCountdown";

export function WeddingSuperJuniorPackageCard() {
  const { days, hrs, min, sec } = usePromoCountdown();

  return (
    <PackagePricingCardShell
      leadSummary={{
        badgeLabel: "Foto & video",
        packageName: "Paket Wedding Super Junior",
        strikethroughPrice: "Rp 4.000.000",
        price: "Rp 3.500.000",
      }}
      header={
        <>
          <div className="flex min-h-0 grow flex-col">
            <p className="text-center">
              <span className="inline-block rounded-lg bg-[var(--package-purple-solid)] px-3 py-1.5 text-xs md:px-4 md:py-2 font-bold uppercase tracking-wider text-white">
                Foto &amp; video
              </span>
            </p>
            <h2 className="mt-3 text-center text-lg font-bold leading-snug text-navy md:mt-5 md:text-xl">
              Paket Wedding Super Junior
            </h2>
          </div>
          <PackageCardPricePromoWrap
            priceArea={
              <PackageCardPriceStack showDivider>
                <p className="text-sm text-muted-foreground line-through">Rp 4.000.000</p>
                <p className="text-3xl font-bold tracking-tight text-navy">Rp 3.500.000</p>
              </PackageCardPriceStack>
            }
            footNote={
              <PackagePromoMarquee text="Cocok untuk acara di Rumah & Restaurant/ Gedung — Paket ini paling banyak diminati." />
            }
          />
        </>
      }
      accordion={
        <PackageAccordionRoot type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="sj-photo" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Photo
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <p className="text-muted-foreground">
                Paket ini dilayani oleh 1 orang Fotografer{" "}
                <strong className="font-semibold text-foreground">Junior</strong> dan menggunakan 1
                kamera{" "}
                <strong className="font-semibold text-foreground">Standard photography</strong>.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Photographer Junior</li>
                <li>1 Kamera (Canon 80D)</li>
                <li>
                  Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod + Stabilizer)
                </li>
                <li>Unlimited Photoshoot (File dikirim via Gdrive + FD)</li>
                <li>100 Foto di Edit</li>
                <li>Full Sesi Pemotretan (Sampai Selesai Acara)</li>
                <li>Hasil akan di terima dalam 14 - 21 hari Kerja setelah acara selesai.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sj-video" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Cinematic Video
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <p className="text-muted-foreground">
                Paket ini dilayani oleh 1 orang Videografer{" "}
                <strong className="font-semibold text-foreground">Junior</strong> dan menggunakan 1
                kamera{" "}
                <strong className="font-semibold text-foreground">Standard photography</strong>.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Videographer Junior</li>
                <li>1 Kamera + Peralatan Tripod + Gimbal (Stabilizer)</li>
                <li>
                  Hasil Liputan Video Dokumentasi Acara yang sudah di edit (
                  <strong>bukan video cinematic</strong>)
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sj-album" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Album Kolase
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <ul className="list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Album Kolase Standard 22 Halaman</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sj-bonus" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Bonus
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <ul className="list-disc space-y-1.5 pl-4 text-foreground/90">
                <li className="text-muted-foreground line-through">
                  Cinematic Video Highlight Feed IG (Durasi 30 Detik)
                </li>
                <li>Gratis 3x Cetak Foto 4R Senilai Rp. 50.000</li>
                <li>
                  Gratis Flashdisk 8 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp
                  200.000
                </li>
                <li>Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </PackageAccordionRoot>
      }
      footer={
        <>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Total Bonus Gratis yang kamu dapat Senilai Rp 350.000
          </p>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Promo Berakhir Dalam
          </p>
          <div className="mt-1 grid grid-cols-4 gap-2 text-center text-[0.65rem] font-medium uppercase tracking-wide text-white md:gap-3 md:text-xs">
            {[
              { value: days, label: "Days" },
              { value: hrs, label: "Hours" },
              { value: min, label: "Minutes" },
              { value: sec, label: "Seconds" },
            ].map((u) => (
              <div
                key={u.label}
                className="rounded-lg bg-[var(--package-purple-solid)] px-1 py-3 text-center shadow-sm md:px-2 md:py-4"
              >
                <div className="text-lg font-bold tabular-nums md:text-2xl">{u.value}</div>
                <div className="mt-1 opacity-90">{u.label}</div>
              </div>
            ))}
          </div>
        </>
      }
      cta={<PackageConsultLeadForm packageLabel="Paket Wedding Super Junior" />}
    />
  );
}
