import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";

const MOBILE_DRAWER_MS = 300;

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about-us", label: "About Us" },
  { to: "/service", label: "Service" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
] as const;

export function Header() {
  const location = useLocation();
  const [mobileMounted, setMobileMounted] = useState(false);
  const [mobileEntered, setMobileEntered] = useState(false);
  const mobileMountedRef = useRef(false);
  const isClosingMobileRef = useRef(false);
  const mobileCloseTimerRef = useRef<number | null>(null);

  mobileMountedRef.current = mobileMounted;

  const openMobileNav = () => {
    isClosingMobileRef.current = false;
    setMobileMounted(true);
  };

  const closeMobileNav = () => {
    isClosingMobileRef.current = true;
    setMobileEntered(false);
  };

  useEffect(() => {
    if (!mobileMountedRef.current) return;
    isClosingMobileRef.current = true;
    setMobileEntered(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMounted) {
      setMobileEntered(false);
      return;
    }
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setMobileEntered(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [mobileMounted]);

  useEffect(() => {
    document.body.style.overflow = mobileMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMounted]);

  useEffect(() => {
    if (!mobileMounted || mobileEntered || !isClosingMobileRef.current) return;
    mobileCloseTimerRef.current = window.setTimeout(() => {
      mobileCloseTimerRef.current = null;
      setMobileMounted(false);
      isClosingMobileRef.current = false;
    }, MOBILE_DRAWER_MS + 80);
    return () => {
      if (mobileCloseTimerRef.current !== null) {
        window.clearTimeout(mobileCloseTimerRef.current);
        mobileCloseTimerRef.current = null;
      }
    };
  }, [mobileMounted, mobileEntered]);

  const finishMobileClose = () => {
    if (mobileCloseTimerRef.current !== null) {
      window.clearTimeout(mobileCloseTimerRef.current);
      mobileCloseTimerRef.current = null;
    }
    setMobileMounted(false);
    isClosingMobileRef.current = false;
  };

  const mobilePortal =
    typeof document !== "undefined" && mobileMounted
      ? createPortal(
          <>
            <button
              type="button"
              className={`fixed inset-0 z-[200] bg-black/60 transition-opacity ease-in-out md:hidden ${
                mobileEntered ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDuration: `${MOBILE_DRAWER_MS}ms` }}
              aria-label="Tutup menu navigasi"
              onClick={closeMobileNav}
            />
            <nav
              className={`fixed inset-y-0 right-0 z-[210] flex w-[min(88vw,24rem)] flex-col border-l border-border bg-background shadow-xl transition-transform ease-in-out will-change-transform md:hidden ${
                mobileEntered ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ transitionDuration: `${MOBILE_DRAWER_MS}ms` }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
              onClick={(ev) => ev.stopPropagation()}
              onTransitionEnd={(e) => {
                if (e.propertyName !== "transform") return;
                if (!isClosingMobileRef.current) return;
                finishMobileClose();
              }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold text-navy">Menu</span>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-navy transition-colors hover:border-accent-orange hover:text-accent-orange"
                  aria-label="Tutup menu"
                  onClick={closeMobileNav}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    ×
                  </span>
                </button>
              </div>
              <div className="overflow-y-auto p-4 pb-8">
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
          </>,
          document.body,
        )
      : null;

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

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-navy transition-colors hover:border-accent-orange hover:text-accent-orange md:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileMounted}
            onClick={openMobileNav}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          {mobilePortal}
        </div>
      </div>
    </header>
  );
}
