"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  /**
   * Match strategy: "exact" highlights only the literal path; "prefix"
   * highlights when the pathname starts with `href` (used so /treino/* still
   * lights up "Treinar" since there's no /treino index).
   */
  match: "exact" | "prefix";
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Treinar", match: "exact" },
  { href: "/ranges", label: "Ranges", match: "prefix" },
  { href: "/progresso", label: "Progresso", match: "prefix" },
];

function isActive(pathname: string, link: NavLink): boolean {
  if (link.match === "exact") {
    // The "Treinar" tab also owns drill pages under /treino/*.
    if (link.href === "/") {
      return pathname === "/" || pathname.startsWith("/treino");
    }
    return pathname === link.href;
  }
  return pathname === link.href || pathname.startsWith(link.href + "/");
}

/**
 * Compact concentric-circles "poker chip" logomark with six rim notches.
 * Emerald body + gold inner ring keeps it on-brand without an extra asset.
 */
function ChipLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {/* outer chip body */}
      <circle cx="14" cy="14" r="13" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
      {/* notches around the rim — six evenly-spaced rectangles in gold */}
      <g fill="#fbbf24">
        <rect x="13" y="0.5" width="2" height="3.5" rx="0.5" />
        <rect x="13" y="24" width="2" height="3.5" rx="0.5" />
        <rect x="0.5" y="13" width="3.5" height="2" rx="0.5" />
        <rect x="24" y="13" width="3.5" height="2" rx="0.5" />
        <rect x="4.2" y="4.2" width="3.5" height="2" rx="0.5" transform="rotate(45 5.95 5.2)" />
        <rect x="20.3" y="21.8" width="3.5" height="2" rx="0.5" transform="rotate(45 22.05 22.8)" />
      </g>
      {/* gold inner ring */}
      <circle cx="14" cy="14" r="8" fill="none" stroke="#fbbf24" strokeWidth="1.25" />
      {/* emerald core */}
      <circle cx="14" cy="14" r="4" fill="#10b981" />
    </svg>
  );
}

export function HeaderNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  // Track the pathname the drawer was last observed under. On a route change
  // we reset `open` to false synchronously during render — the React-blessed
  // pattern for "reset state when a prop changes" (avoids setState-in-effect
  // lint and avoids the trap where openOn === pathname can become true again
  // after navigating away and back).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }
  const drawerId = useId();

  // Close drawer on Escape so keyboard users aren't trapped.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Poker Trainer — início"
        >
          <ChipLogo />
          <span className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400 md:text-xl">Poker</span>
            <span className="text-lg font-semibold text-slate-100 md:text-xl">Trainer</span>
          </span>
          <span className="ml-1 hidden rounded border border-slate-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:inline-block">
            MTT · v0.2
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-sm text-slate-400 md:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-sm pb-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 hover:text-emerald-300 " +
                  (active
                    ? "border-b-2 border-emerald-500 text-emerald-400"
                    : "border-b-2 border-transparent")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={drawerId}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-800 text-slate-200 outline-none transition-colors hover:border-slate-700 hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400 md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer — kept in the DOM so the slide animation can play.
          `motion-reduce:transition-none` disables the animation for users who
          prefer reduced motion. */}
      <div
        id={drawerId}
        className={
          "overflow-hidden border-t border-slate-800/80 transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none md:hidden " +
          (open ? "max-h-72 opacity-100" : "pointer-events-none max-h-0 opacity-0")
        }
        aria-hidden={!open}
      >
        <nav
          aria-label="Navegação principal (mobile)"
          className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-[44px] items-center rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 " +
                  (active
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-emerald-300")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
