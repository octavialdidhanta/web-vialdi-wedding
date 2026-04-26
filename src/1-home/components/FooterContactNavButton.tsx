import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { cn } from "@/share/lib/utils";

/** `public/whatsapp logo.png` — space encoded for URL. */
export const WHATSAPP_LOGO_PNG = `${import.meta.env.BASE_URL}whatsapp%20logo.png`;

/** Item bar navigasi cepat mobile — sedikit padding agar bar tidak terlalu tipis. */
export const footerContactNavButtonClass =
  "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-0.5 text-[0.5625rem] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)]/40";

export const footerContactIconBoxClass =
  "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card text-[oklch(0.48_0.2_300)] shadow-sm";

type Props =
  | { variant: "contact"; className?: string }
  | { variant: "whatsapp"; href: string; className?: string };

export function FooterContactNavButton(props: Props) {
  const mergedClass = cn(footerContactNavButtonClass, props.className);

  const label =
    props.variant === "whatsapp" ? (
      <span className="w-full truncate text-center">WhatsApp</span>
    ) : (
      <span className="w-full truncate text-center">Contact</span>
    );

  if (props.variant === "whatsapp") {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={mergedClass}
        aria-label="Chat WhatsApp"
        data-track={TRACK_KEYS.whatsappFloatingClick}
      >
        <div className={footerContactIconBoxClass}>
          <img
            src={WHATSAPP_LOGO_PNG}
            alt=""
            width={256}
            height={256}
            decoding="async"
            draggable={false}
            className="block size-11 max-w-none shrink-0 object-contain"
          />
        </div>
        {label}
      </a>
    );
  }

  return (
    <Link
      to="/contact"
      className={mergedClass}
      aria-label="Contact"
      data-track={TRACK_KEYS.contactCta}
    >
      <div className={footerContactIconBoxClass}>
        <Phone className="h-4 w-4" aria-hidden strokeWidth={1.85} />
      </div>
      {label}
    </Link>
  );
}
