import { Facebook, Link2, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";
import { copyTextToClipboard } from "@/share/lib/copyTextToClipboard";
import { cn } from "@/share/lib/utils";
import {
  buildBlogFooterCopyUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildShareText,
  buildTwitterShareUrl,
  withBlogShareUtm,
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

export function BlogPostShareStickyFooter({
  title,
  url,
  slug,
}: {
  title: string;
  url: string;
  slug: string;
}) {
  const facebookUrl = withBlogShareUtm(url, "facebook");
  const xUrl = withBlogShareUtm(url, "x");
  const linkedinUrl = withBlogShareUtm(url, "linkedin");
  const whatsappUrl = withBlogShareUtm(url, "whatsapp");

  const copyUrlWithUtm = buildBlogFooterCopyUrl(url, slug);

  const shareText = buildShareText(title, url);
  const shareTextWa = buildShareText(title, whatsappUrl);

  const items: ShareItem[] = [
    { id: "facebook", label: "Share ke Facebook", href: buildFacebookShareUrl(facebookUrl), Icon: Facebook },
    {
      id: "twitter",
      label: "Share ke X",
      href: buildTwitterShareUrl(shareText, xUrl),
      Icon: Twitter,
    },
    {
      id: "linkedin",
      label: "Share ke LinkedIn",
      href: buildLinkedInShareUrl(linkedinUrl),
      Icon: Linkedin,
    },
    {
      id: "whatsapp",
      label: "Share ke WhatsApp",
      href: buildWhatsAppShareUrl(shareTextWa),
      Icon: MessageCircle,
    },
  ];

  const copyLabel = "Salin tautan dengan UTM";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[260] border-t border-border/60 bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Share artikel"
    >
      <div className="mx-auto grid max-w-[90rem] grid-cols-5 gap-0.5 px-0.5 py-0.5 sm:gap-1 sm:px-1">
        {items.map((it) => (
          <a
            key={it.id}
            href={it.href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors sm:px-2 sm:text-[11px]",
              "hover:bg-muted/50 hover:text-navy",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2",
              "active:bg-muted/60",
            )}
            aria-label={it.label}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background">
              <it.Icon className="h-4 w-4" aria-hidden strokeWidth={1.9} />
            </div>
          </a>
        ))}
        <button
          type="button"
          className={cn(
            "inline-flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors sm:px-2 sm:text-[11px]",
            "hover:bg-muted/50 hover:text-navy",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2",
            "active:bg-muted/60",
          )}
          aria-label={copyLabel}
          title={copyUrlWithUtm}
          onClick={async () => {
            const ok = await copyTextToClipboard(copyUrlWithUtm);
            if (ok) toast.success("Tautan disalin");
            else toast.error("Gagal menyalin");
          }}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background">
            <Link2 className="h-4 w-4" aria-hidden strokeWidth={1.9} />
          </div>
        </button>
      </div>
    </nav>
  );
}

