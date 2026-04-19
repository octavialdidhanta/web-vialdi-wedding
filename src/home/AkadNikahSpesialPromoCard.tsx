import { AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { PackageAccordionRoot } from "@/home/packageAccordionViewport";
import { PackageCardPriceStack } from "@/home/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/home/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/home/PackagePromoMarquee";
import { PackageConsultLeadForm } from "@/home/PackageConsultLeadForm";
import { PackagePricingCardShell } from "@/home/PackagePricingCardShell";
import { usePromoCountdown } from "@/home/usePromoCountdown";

export function AkadNikahSpesialPromoCard() {
  const { days, hrs, min, sec } = usePromoCountdown();

  return (
    <PackagePricingCardShell
      leadSummary={{
        badgeLabel: "> Foto only",
        packageName: "Akad Nikah Spesial Promo",
        strikethroughPrice: "Rp 1.750.000",
        price: "Rp 1.500.000",
      }}
      header={
        <>
          <div className="flex min-h-0 grow flex-col">
            <p className="text-center">
              <span className="inline-block rounded-lg bg-[var(--package-purple-solid)] px-3 py-2 text-xs md:px-4 font-bold uppercase tracking-wider text-white">
                &gt; Foto only
              </span>
            </p>
            <h2 className="mt-5 text-center text-lg font-bold leading-snug text-navy md:text-xl">
              Akad Nikah Spesial Promo
            </h2>
          </div>
          <PackageCardPricePromoWrap
            priceArea={
              <PackageCardPriceStack showDivider>
                <p className="text-sm text-muted-foreground line-through">Rp 1.750.000</p>
                <p className="text-3xl font-bold tracking-tight text-navy">Rp 1.500.000</p>
              </PackageCardPriceStack>
            }
            footNote={
              <PackagePromoMarquee text="Cocok untuk acara di Hotel & Gedung" />
            }
          />
        </>
      }
      accordion={
        <PackageAccordionRoot type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="an-photo" className="border-0">
            <AccordionTrigger className="rounded-lg bg-[var(--package-purple-solid)] px-3 py-3.5 text-sm md:px-4 font-bold text-white hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-[var(--package-purple-open)] [&>svg]:text-white">
              Photo
            </AccordionTrigger>
            <AccordionContent className="rounded-b-lg border border-t-0 border-border bg-[oklch(0.97_0.01_90)] px-3 pb-4 pt-3 text-[0.8125rem] md:px-4 leading-relaxed data-[state=closed]:border-0">
              <p className="text-muted-foreground">
                Paket ini dilayani oleh 1 orang Fotografer{" "}
                <strong className="font-semibold text-foreground">Profesional</strong> dan
                menggunakan 1 kamera{" "}
                <strong className="font-semibold text-foreground">Profesional</strong>.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-foreground/90">
                <li>1 Photographer Profesional</li>
                <li>1 Kamera (Sony a7Riii)</li>
                <li>Flash</li>
                <li>Unlimited Photoshoot (File dikirim via Gdrive)</li>
                <li>30 Foto di Edit</li>
                <li>
                  <strong>2 Jam Sesi Pemotretan</strong>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </PackageAccordionRoot>
      }
      footer={
        <>
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
      cta={<PackageConsultLeadForm packageLabel="Akad Nikah Spesial Promo" />}
    />
  );
}
