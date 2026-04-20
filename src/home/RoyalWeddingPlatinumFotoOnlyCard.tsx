import { AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { PackageAccordionRoot } from "@/home/packageAccordionViewport";
import { PackageCardPriceStack } from "@/home/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/home/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/home/PackagePromoMarquee";
import { PackageConsultLeadForm } from "@/home/PackageConsultLeadForm";
import { PackagePricingCardShell } from "@/home/PackagePricingCardShell";
import royalWeddingPriceBadge from "@/home/assets/Untitled design (3).png";

export function RoyalWeddingPlatinumFotoOnlyCard() {
  return (
    <PackagePricingCardShell
      leadSummary={{
        badgeLabel: "Foto only",
        packageName: "Royal Wedding Platinum + Album Foto",
        strikethroughPrice: "Rp 4.500.000",
        price: "Rp 3.500.000",
      }}
      header={
        <>
          <div className="flex min-h-0 grow flex-col">
            <p className="text-center">
              <span className="inline-block rounded-lg bg-[var(--package-purple-solid)] px-3 py-1.5 text-xs md:px-4 md:py-2 font-bold uppercase tracking-wider text-white">
                Foto only
              </span>
            </p>
            <h2 className="mt-3 text-center text-lg font-bold leading-snug text-navy md:mt-5 md:text-xl">
              Royal Wedding Platinum + Album Foto
            </h2>
          </div>
          <PackageCardPricePromoWrap
            priceArea={
              <PackageCardPriceStack
                showDivider
                leading={
                  <img
                    src={royalWeddingPriceBadge}
                    alt="Lencana promo paket Royal Wedding Platinum"
                    className="block h-11 w-full max-w-none object-contain object-left md:h-[3.75rem]"
                    loading="lazy"
                    decoding="async"
                  />
                }
              >
                <p className="text-sm text-muted-foreground line-through">Rp 4.500.000</p>
                <p className="text-3xl font-bold tracking-tight text-navy">Rp 3.500.000</p>
              </PackageCardPriceStack>
            }
            footNote={
              <PackagePromoMarquee text="Cocok untuk acara di Hotel & Gedung. CLIENT PRIORITAS (HASIL FOTO DI TERIMA DALAM 3 HARI), paket ini paling banyak diminati." />
            }
          />
        </>
      }
      accordion={
        <PackageAccordionRoot type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="pl-photo" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Photo
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <p className="text-muted-foreground">
                Paket ini dilayani oleh 2 orang Fotografer Profesional dan menggunakan 2 kamera
                Profesional.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Photografer utama + 1 Photografer Candid</li>
                <li>2 Kamera Profesional (Sony A7Riii)</li>
                <li>Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod)</li>
                <li>Unlimited Photoshoot (File dikirim via Gdrive + FD)</li>
                <li>200 Foto di Edit</li>
                <li>6 Jam Sesi Pemotretan</li>
                <li>Hasil akan di terima dalam 3 hari setelah acara selesai.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pl-album" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Album Kolase
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <ul className="list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Album Kolase / Album Foto Laminating Semidoff 22 Halaman</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pl-bonus" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Bonus
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <ul className="list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>
                  Gratis 3x Cetak Foto 4R + 3 Frame / Bingkai Foto 4R Standard Senilai 150.000
                </li>
                <li>
                  Gratis 1 Flashdisk 16 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp
                  200.000
                </li>
                <li>Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pl-extra" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Extra Bonus
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <ul className="list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>Bonus tambahan 2 jam durasi foto.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </PackageAccordionRoot>
      }
      footer={
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Total Bonus Gratis yang kamu dapat Senilai Rp 500.000
        </p>
      }
      cta={<PackageConsultLeadForm packageLabel="Royal Wedding Platinum + Album Foto" />}
    />
  );
}
