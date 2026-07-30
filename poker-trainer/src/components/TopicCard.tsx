"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Topic } from "@/domain/topics";
import { summarize } from "@/domain/progress";
import { loadProgress } from "@/storage/localProgress";
import { ProgressBadge } from "./ProgressBadge";

type HeroPos = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";

// 6-max seat coordinates on a 64x32 ellipse (table rendered ~32px tall in the card).
// Order around the oval: BTN (right), CO (top-right), HJ (top-left), UTG (left),
// SB (bottom-left), BB (bottom-right). Approximation good enough for a glance.
const SEAT_COORDS: Record<HeroPos, { x: number; y: number }> = {
  BTN: { x: 56, y: 16 },
  CO: { x: 44, y: 5 },
  HJ: { x: 20, y: 5 },
  UTG: { x: 8, y: 16 },
  SB: { x: 20, y: 27 },
  BB: { x: 44, y: 27 },
};

const SEAT_ORDER: HeroPos[] = ["BTN", "CO", "HJ", "UTG", "SB", "BB"];

/**
 * Best-effort hero-position extraction from a topic slug. We look for a position
 * token (btn/co/hj/utg/sb/bb) — the first match wins. Falls back to BTN.
 *
 * Slugs in this codebase look like `pf-btn-7bb`, `open-co-25bb`,
 * `icm-bubble-sb-jam-15bb`, etc. — so this heuristic is reliable for the
 * current dataset.
 */
function heroPosFromSlug(slug: string): HeroPos {
  const tokens = slug.toLowerCase().split(/[^a-z0-9]+/);
  for (const t of tokens) {
    if (t === "btn") return "BTN";
    if (t === "co") return "CO";
    if (t === "hj") return "HJ";
    if (t === "utg" || t === "utg1") return "UTG";
    if (t === "sb") return "SB";
    if (t === "bb") return "BB";
  }
  return "BTN";
}

/**
 * Pulls the first stack-size token from the slug, e.g. `pf-btn-7bb` -> 7.
 * Returns null when no `<number>bb` token is found.
 */
function stackBBFromSlug(slug: string): number | null {
  const m = slug.toLowerCase().match(/(\d+)bb/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function PositionDiagram({ hero }: { hero: HeroPos }) {
  return (
    <svg
      width="64"
      height="32"
      viewBox="0 0 64 32"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Table felt */}
      <ellipse
        cx="32"
        cy="16"
        rx="28"
        ry="12"
        className="fill-slate-800 stroke-slate-700"
        strokeWidth="1"
      />
      {SEAT_ORDER.map((pos) => {
        const c = SEAT_COORDS[pos];
        const isHero = pos === hero;
        return (
          <circle
            key={pos}
            cx={c.x}
            cy={c.y}
            r={isHero ? 3 : 2}
            className={
              isHero
                ? "fill-emerald-400 stroke-emerald-300"
                : "fill-slate-600 stroke-slate-500"
            }
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

function ChipStackIcon({ stackBB }: { stackBB: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-300"
      aria-label={`Stack ${stackBB} BB`}
    >
      <svg
        width="10"
        height="12"
        viewBox="0 0 10 12"
        aria-hidden="true"
        className="text-emerald-400"
      >
        {/* Three stacked chips */}
        <ellipse cx="5" cy="10" rx="4" ry="1.5" className="fill-current opacity-90" />
        <ellipse cx="5" cy="7" rx="4" ry="1.5" className="fill-current opacity-70" />
        <ellipse cx="5" cy="4" rx="4" ry="1.5" className="fill-current opacity-50" />
      </svg>
      {stackBB} BB
    </span>
  );
}

export function TopicCard({ topic }: { topic: Topic }) {
  const [stats, setStats] = useState<{ total: number; correctPct: number } | null>(null);

  useEffect(() => {
    const p = loadProgress(topic.id);
    const s = summarize(p);
    setStats({ total: s.total, correctPct: s.correctPct });
  }, [topic.id]);

  const hero = useMemo(() => heroPosFromSlug(topic.slug), [topic.slug]);
  const stackBB = useMemo(() => stackBBFromSlug(topic.slug), [topic.slug]);

  return (
    <Link
      href={`/treino/${topic.slug}`}
      className={
        // min-h enforces the 44px touch-target requirement; whole card is the hit area.
        "group block min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 p-5 shadow " +
        "transition-[transform,box-shadow,border-color,background-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-900/20 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      }
    >
      <div className="flex items-start gap-3">
        <PositionDiagram hero={hero} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white group-hover:text-emerald-300">
                {topic.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  {hero}
                </span>
                {stackBB !== null && <ChipStackIcon stackBB={stackBB} />}
              </div>
            </div>
            <ProgressBadge
              variant="ring"
              attempts={stats?.total ?? 0}
              target={topic.targetAttempts}
              correctPct={stats?.correctPct ?? 0}
            />
          </div>
          <p className="text-sm text-slate-400">{topic.description}</p>
        </div>
      </div>
    </Link>
  );
}
