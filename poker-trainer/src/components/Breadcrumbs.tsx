"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import topicsJson from "@/data/topics.json";

type TopicEntry = { slug: string; title: string };

// We deliberately import topics.json directly (instead of `@/data`) so this
// client component doesn't drag the whole range/spots compiler into the
// browser bundle. Only the (slug, title) pair is needed for breadcrumb labels.
const TOPIC_TITLES: Record<string, string> = Object.fromEntries(
  (topicsJson as TopicEntry[]).map((t) => [t.slug, t.title]),
);

const SECTION_LABEL: Record<string, string> = {
  treino: "Treinar",
  jogar: "Jogar",
  ranges: "Ranges",
  analisar: "Analisar",
  progresso: "Progresso",
  sessao: "Sessão",
};

// Top-level sections whose first segment is itself the destination link.
// /ranges and /progresso are pages on their own; /treino is only ever a
// container (its index lives at "/"), so it links home.
const SECTION_HREF: Record<string, string> = {
  treino: "/",
  jogar: "/jogar",
  ranges: "/ranges",
  analisar: "/analisar",
  progresso: "/progresso",
  sessao: "/",
};

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string, currentLabel?: string): Crumb[] {
  // Always start with Treinar = home; gives users a one-click escape hatch.
  const crumbs: Crumb[] = [{ label: "Treinar", href: "/" }];

  if (!pathname || pathname === "/") {
    // On the home page there's no second crumb; the header already says
    // "Treinar" so rendering just one item is noisy — caller (layout) will
    // suppress single-crumb trails.
    return crumbs;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return crumbs;

  const [head, ...rest] = segments;
  const sectionLabel = SECTION_LABEL[head];
  const sectionHref = SECTION_HREF[head] ?? `/${head}`;

  // Unknown top-level segment — render it literally so the breadcrumb still
  // makes sense for routes added later without touching this component.
  if (!sectionLabel) {
    crumbs.length = 0;
    crumbs.push({ label: head, href: sectionHref });
    if (rest.length > 0) crumbs.push({ label: currentLabel ?? rest.join("/") });
    return crumbs;
  }

  // Replace the default "Treinar" head when the section is something else.
  if (head !== "treino") {
    crumbs[0] = { label: sectionLabel, href: sectionHref };
  }

  if (rest.length === 0) {
    // Section index (/ranges, /progresso) — the trailing crumb is the section
    // itself, so flag it as the current (no href) to match the active state.
    crumbs[0] = { label: sectionLabel };
    return crumbs;
  }

  // Last segment is the "leaf" — prefer explicit override, then topic title
  // lookup, then a humanised fallback derived from the slug.
  const leafSlug = rest[rest.length - 1];
  const leafLabel =
    currentLabel ?? TOPIC_TITLES[leafSlug] ?? humaniseSlug(leafSlug);

  crumbs.push({ label: leafLabel });
  return crumbs;
}

function humaniseSlug(slug: string): string {
  // Fallback when we have no curated title — turns "open-btn-25bb" into
  // "Open Btn 25Bb". Not gorgeous but better than the raw slug.
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs({ currentLabel }: { currentLabel?: string }) {
  const pathname = usePathname() ?? "/";
  const crumbs = buildCrumbs(pathname, currentLabel);

  // Suppress single-crumb trails — they add chrome without information when
  // we're already on the section the crumb points at.
  if (crumbs.length < 2) return null;

  return (
    <nav
      aria-label="Trilha de navegação"
      className="mx-auto max-w-5xl px-4 pt-3 text-xs text-slate-500 md:px-6"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-x-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-slate-700">
                  /
                </span>
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="rounded-sm outline-none transition-colors hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-emerald-400" : "text-slate-500"}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
