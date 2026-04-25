import type { ReactNode } from "react";
import { PackageCardPriceStack } from "@/home/PackageCardPriceStack";
import { PackageCardPricePromoWrap } from "@/home/PackageCardPricePromoWrap";
import { PackagePromoMarquee } from "@/home/PackagePromoMarquee";
import { PackageConsultLeadForm } from "@/home/PackageConsultLeadForm";
import { PackagePricingCardShell } from "@/home/PackagePricingCardShell";
import { usePromoCountdown } from "@/home/usePromoCountdown";
import type { AgencyPackageRow } from "@/agency/agencyPackages";
import { resolveAgencyPackageStorageUrl } from "@/agency/agencyPackages";
import bestSellerBadgePng from "@/home/assets/Untitled design (3).png";

function formatIdr(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function CountdownFooter({ label, targetMs }: { label: string; targetMs: number }) {
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

export function AgencyPackagePricingCard({
  pkg,
  accordion,
}: {
  pkg: AgencyPackageRow;
  accordion: ReactNode;
}) {
  const badgeLower = pkg.badge_label.toLowerCase();
  const isAds = badgeLower.includes("ads");
  const isFullFunnel = badgeLower.includes("full funnel");
  const showSpendRange = isAds || isFullFunnel;
  const badgeUrl = resolveAgencyPackageStorageUrl(pkg.badge_image_path, pkg.badge_image_url);
  const bestSellerUrl = resolveAgencyPackageStorageUrl(pkg.best_seller_image_path, pkg.best_seller_image_url);
  const countdownMs = pkg.promo_countdown_ends_at ? new Date(pkg.promo_countdown_ends_at).getTime() : null;

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

  const spentMin = pkg.spent_budget_min ?? null;
  const spentMax = pkg.spent_budget_max ?? null;
  const currency = pkg.spent_budget_currency ?? "IDR";
  const period = pkg.spent_budget_period ?? "per bulan";
  const feePct = pkg.fee_percent ?? null;

  const spendLine =
    showSpendRange && spentMin !== null && spentMax !== null
      ? `Rekomendasi ad spend ${currency} ${formatIdr(spentMin)}–${formatIdr(spentMax)} ${period}`.trim()
      : null;

  const feeLine =
    isAds && spentMin !== null && spentMax !== null && feePct !== null
      ? `Estimasi fee: ${currency} ${formatIdr((spentMin * feePct) / 100)}–${formatIdr((spentMax * feePct) / 100)} (${feePct}%)`
      : isAds && feePct !== null
        ? `Fee: ${feePct}% dari ad spend`
        : null;

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
                <p className="text-3xl font-bold tracking-tight text-navy">
                  {isAds && feePct !== null ? `${feePct}%` : pkg.price}
                </p>
                {isAds ? (
                  <p className="mt-1 text-center text-xs text-muted-foreground md:text-sm">Management fee dari ad spend</p>
                ) : null}
              </PackageCardPriceStack>
            }
            footNote={pkg.promo_marquee_text ? <PackagePromoMarquee text={pkg.promo_marquee_text} /> : null}
          />
          {spendLine ? (
            <p className="mt-2 text-center text-xs text-muted-foreground md:text-sm">{spendLine}</p>
          ) : null}
          {feeLine ? (
            <p className="mt-1 text-center text-xs text-muted-foreground md:text-sm">{feeLine}</p>
          ) : null}
        </>
      }
      accordion={accordion}
      footer={
        <>
          {pkg.footer_note ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground md:text-sm">{pkg.footer_note}</p>
          ) : null}
          {pkg.footer_extra_html ? (
            <div
              className="blog-post-html mt-2 text-center text-xs leading-relaxed text-muted-foreground md:text-sm"
              dangerouslySetInnerHTML={{ __html: pkg.footer_extra_html }}
            />
          ) : null}
          {pkg.show_footer_countdown && countdownMs !== null && !Number.isNaN(countdownMs) ? (
            <div className="mt-2">
              <CountdownFooter label={pkg.footer_countdown_label?.trim() || "Promo Berakhir Dalam"} targetMs={countdownMs} />
            </div>
          ) : null}
        </>
      }
      cta={<PackageConsultLeadForm packageLabel={pkg.package_label} />}
    />
  );
}

