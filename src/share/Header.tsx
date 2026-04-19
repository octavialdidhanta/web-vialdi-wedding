import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about-us", label: "About Us" },
  { to: "/service", label: "Service" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
] as const;

export function Header() {
  const mobileNavRef = useRef<HTMLDetailsElement>(null);

  const closeMobileNav = () => {
    mobileNavRef.current?.removeAttribute("open");
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-6">
        <Link to="/" className="flex flex-wrap items-baseline gap-x-1 text-xl font-bold tracking-tight md:text-2xl">
          <span className="text-navy">Vialdi</span>
          <span className="bg-gradient-to-r from-[oklch(0.55_0.2_350)] to-[oklch(0.5_0.18_300)] bg-clip-text text-transparent">
            Wedding
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              {...(link.to === "/contact" ? { "data-track": TRACK_KEYS.contactCta } : {})}
              className={({ isActive }) =>
                `text-sm font-medium text-muted-foreground transition-colors hover:text-primary ${
                  isActive ? "text-primary" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/service"
            className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 md:inline-flex"
          >
            Lihat Service
          </Link>
          <Link
            to="/contact"
            data-track={TRACK_KEYS.contactCta}
            className="hidden rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-navy shadow-sm transition-all hover:border-accent-orange hover:text-accent-orange md:inline-flex"
          >
            Contact
          </Link>

          {/* Mobile nav: `<details>` menggantikan Radix Sheet agar dialog/remove-scroll tidak membesarkan bundle beranda. */}
          <details
            ref={mobileNavRef}
            className="relative md:hidden"
            onToggle={(e) => {
              document.body.style.overflow = e.currentTarget.open ? "hidden" : "";
            }}
          >
            <summary
              className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-border bg-card text-navy transition-colors hover:border-accent-orange hover:text-accent-orange [&::-webkit-details-marker]:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div
              className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/60 md:hidden"
              aria-hidden
              onClick={closeMobileNav}
            />
            <nav
              className="fixed right-0 top-16 z-50 flex h-[calc(100dvh-4rem)] w-[min(85vw,24rem)] flex-col border-l border-border bg-background shadow-lg md:hidden"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="overflow-y-auto p-6 pt-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === "/"}
                      {...(link.to === "/contact" ? { "data-track": TRACK_KEYS.contactCta } : {})}
                      onClick={closeMobileNav}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          isActive
                            ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                            : "border-border bg-card text-navy hover:border-accent-orange hover:text-accent-orange"
                        }`
                      }
                    >
                      <span>{link.label}</span>
                      <span className="text-muted-foreground">→</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
