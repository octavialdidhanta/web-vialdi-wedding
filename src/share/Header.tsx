import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/share/ui/sheet";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about-us", label: "About Us" },
  { to: "/service", label: "Service" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
] as const;

export function Header() {
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

          {/* Mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-navy transition-colors hover:border-accent-orange hover:text-accent-orange md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
              <div className="mt-10">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.to === "/"}
                        {...(link.to === "/contact" ? { "data-track": TRACK_KEYS.contactCta } : {})}
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
                    </SheetClose>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
