import { Facebook, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { cn } from "@/share/lib/utils";
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildShareText,
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
} from "@/share/socialShare";

/**
 * Padding bawah konten halaman (mobile/tablet) agar footer share fixed tidak menutupi isi.
 * Mengikuti pola `MobileHomeStickyFooter` namun untuk breakpoint sampai tablet.
 */
export const blogPostShareStickyFooterPageBottomPaddingClass =
  "pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

type ShareItem = {
  id: "facebook" | "twitter" | "linkedin" | "whatsapp";
  label: string;
  href: string;
  Icon: typeof Facebook;
};

export function BlogPostShareStickyFooter({ title, url }: { title: string; url: string }) {
  const shareText = buildShareText(title, url);

  const items: ShareItem[] = [
    { id: "facebook", label: "Share ke Facebook", href: buildFacebookShareUrl(url), Icon: Facebook },
    {
      id: "twitter",
      label: "Share ke X",
      href: buildTwitterShareUrl(shareText, url),
      Icon: Twitter,
    },
    { id: "linkedin", label: "Share ke LinkedIn", href: buildLinkedInShareUrl(url), Icon: Linkedin },
    { id: "whatsapp", label: "Share ke WhatsApp", href: buildWhatsAppShareUrl(shareText), Icon: MessageCircle },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[260] border-t border-border/60 bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Share artikel"
    >
      <div className="mx-auto grid max-w-[90rem] grid-cols-4 gap-1 px-1 py-0.5">
        {items.map((it) => (
          <a
            key={it.id}
            href={it.href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex w-full flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors",
              "hover:bg-muted/50 hover:text-navy",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2",
              "active:bg-muted/60",
            )}
            aria-label={it.label}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background">
              <it.Icon className="h-4 w-4" aria-hidden strokeWidth={1.9} />
            </div>
          </a>
        ))}
      </div>
    </nav>
  );
}

