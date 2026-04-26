import type { ReactNode } from "react";
import { PackageCardPriceStack } from "@/1-home/packages/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/1-home/packages/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/1-home/packages/PackagePromoMarquee";
import { PackageConsultLeadForm } from "@/1-home/packages/PackageConsultLeadForm";
import { PackagePricingCardShell } from "@/1-home/packages/PackagePricingCardShell";
import { usePromoCountdown } from "@/1-home/packages/usePromoCountdown";
import type { WeddingPackageRow } from "@/blog/weddingPackages";
import { resolvePackageStorageUrl } from "@/blog/weddingPackages";
import bestSellerBadgePng from "@/1-home/assets/Untitled design (3).png";

function CountdownFooter({
  label,
  targetMs,
}: {
  label: string;
  targetMs: number;
}) {
  const { days, hrs, min, sec } = usePromoCountdown(targetMs);
  return (
    <>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">{label}</p>
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
  );
}

type Props = {
  pkg: WeddingPackageRow;
  accordion: ReactNode;
};

export function WeddingPackagePricingCard({ pkg, accordion }: Props) {
  const badgeUrl = resolvePackageStorageUrl(pkg.badge_image_path, pkg.badge_image_url);
  const bestSellerUrl = resolvePackageStorageUrl(pkg.best_seller_image_path, pkg.best_seller_image_url);
  const countdownMs = pkg.promo_countdown_ends_at
    ? new Date(pkg.promo_countdown_ends_at).getTime()
    : null;

  let leadingNode: ReactNode;
  if (badgeUrl) {
    leadingNode = (
      <img
        src={badgeUrl}
        alt="Lencana promo paket"
        className="block h-11 w-full max-w-none object-contain object-left md:h-[3.75rem]"
        loading="lazy"
        decoding="async"
      />
    );
  } else if (pkg.show_best_seller && bestSellerUrl) {
    leadingNode = (
      <img
        src={bestSellerUrl}
        alt="Best seller"
        className="block h-11 w-full max-w-none object-contain object-left md:h-[3.75rem]"
        loading="lazy"
        decoding="async"
      />
    );
  } else if (pkg.show_best_seller) {
    leadingNode = (
      <img
        src={bestSellerBadgePng}
        alt="Best seller"
        className="block h-11 w-full max-w-none object-contain object-left md:h-[3.75rem]"
        loading="lazy"
        decoding="async"
      />
    );
  } else {
    leadingNode = undefined;
  }

  return (
    <PackagePricingCardShell
      leadSummary={{
        badgeLabel: pkg.badge_label,
        packageName: pkg.title,
        strikethroughPrice: pkg.strikethrough_price ?? undefined,
        price: pkg.price,
      }}
      header={
        <>
          <div className="flex min-h-0 grow flex-col">
            <p className="text-center">
              <span className="inline-block rounded-lg bg-[var(--package-purple-solid)] px-3 py-1.5 text-xs md:px-4 md:py-2 font-bold uppercase tracking-wider text-white">
                {pkg.badge_label}
              </span>
            </p>
            <h2 className="mt-3 text-center text-lg font-bold leading-snug text-navy md:mt-5 md:text-xl">
              {pkg.title}
            </h2>
          </div>
          <PackageCardPricePromoWrap
            priceArea={
              <PackageCardPriceStack showDivider={Boolean(leadingNode)} leading={leadingNode}>
                {pkg.strikethrough_price ? (
                  <p className="text-sm text-muted-foreground line-through">{pkg.strikethrough_price}</p>
                ) : null}
                <p className="text-3xl font-bold tracking-tight text-navy">{pkg.price}</p>
              </PackageCardPriceStack>
            }
            footNote={
              pkg.promo_marquee_text ? <PackagePromoMarquee text={pkg.promo_marquee_text} /> : null
            }
          />
        </>
      }
      accordion={accordion}
      footer={
        <>
          {pkg.footer_note ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground md:text-sm">
              {pkg.footer_note}
            </p>
          ) : null}
          {pkg.footer_extra_html ? (
            <div
              className="blog-post-html mt-2 text-center text-xs leading-relaxed text-muted-foreground md:text-sm"
              dangerouslySetInnerHTML={{ __html: pkg.footer_extra_html }}
            />
          ) : null}
          {pkg.show_footer_countdown && countdownMs !== null && !Number.isNaN(countdownMs) ? (
            <div className="mt-2">
              <CountdownFooter
                label={pkg.footer_countdown_label?.trim() || "Promo Berakhir Dalam"}
                targetMs={countdownMs}
              />
            </div>
          ) : null}
        </>
      }
      cta={<PackageConsultLeadForm packageLabel={pkg.package_label} />}
    />
  );
}
