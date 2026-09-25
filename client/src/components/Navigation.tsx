import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/radio",      label: "Radio"     },
  { href: "/editorial",  label: "Editorial" },
  { href: "/spotlight",  label: "Spotlight" },
  { href: "/community",  label: "Community" },
  { href: "/guides",     label: "Guides"    },
  { href: "/residents",  label: "Residents" },
] as const;

export default function Navigation() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-paper-border bg-paper dark:bg-[var(--card)] dark:border-[var(--border)]"
        style={{ transition: "background var(--duration-base) var(--ease-default)" }}
      >
        <div className="max-w-site mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/logo.png"
                alt="Enamorado Radio"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // Fallback to wordmark if logo file isn't present yet
                  const el = e.currentTarget;
                  el.style.display = "none";
                  el.nextElementSibling?.removeAttribute("style");
                }}
              />
              <span
                style={{ display: "none" }}
                className="font-display font-800 text-xl tracking-wider uppercase text-foreground hover:text-olive transition-colors"
              >
                Enamorado
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "font-mono text-xs uppercase tracking-widest transition-colors",
                    isActive(href)
                      ? "text-olive font-semibold"
                      : "text-ink-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* ── Right: Live dot + Submit CTA + Mobile toggle ── */}
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <Link
                href="/radio"
                className="hidden sm:flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-foreground transition-colors"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--live-dot)] animate-live-pulse"
                  aria-label="Live"
                />
                Live
              </Link>

              {/* Submit CTA */}
              <Link
                href="/submit"
                className="hidden sm:inline-flex items-center px-3 py-1 font-mono text-xs uppercase tracking-widest rounded border border-olive text-olive hover:bg-[var(--olive-subtle)] transition-colors"
              >
                Submit
              </Link>

              {/* Mobile toggle */}
              <button
                className="md:hidden p-1 text-ink-muted hover:text-foreground transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-12 inset-x-0 border-b border-paper-border bg-background px-6 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-6" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "font-display font-600 text-3xl uppercase tracking-wide transition-colors",
                    isActive(href) ? "text-olive" : "text-foreground hover:text-olive",
                  ].join(" ")}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}

              {/* Mobile live + submit */}
              <div className="pt-4 border-t border-paper-border flex flex-col gap-3">
                <Link
                  href="/radio"
                  className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-ink-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--live-dot)] animate-live-pulse" />
                  Live Radio
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center px-4 py-2 font-mono text-sm uppercase tracking-widest rounded border border-olive text-olive hover:bg-[var(--olive-subtle)] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Submit
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
