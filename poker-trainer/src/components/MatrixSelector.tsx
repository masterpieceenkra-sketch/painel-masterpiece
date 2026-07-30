"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Position } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import { summarize } from "@/domain/progress";
import { ACTION_NODE_LABEL, type ActionNode, type TopicMatrixEntry } from "@/data";
import { loadProgress } from "@/storage/localProgress";
import { cn } from "@/lib/cn";
import { formatPct } from "@/lib/format";

const NODE_ORDER: ActionNode[] = [
  "push-fold-jam",
  "push-fold-call",
  "open",
  "3bet",
  "icm",
  "postflop",
];

// Tab glyph per action node. Unicode suits/glyphs scale better than tiny SVGs
// at the chip-row size and align with the poker idiom requested in the brief.
const NODE_ICON: Record<ActionNode, string> = {
  "push-fold-jam": "♠",
  "push-fold-call": "♥",
  open: "♣",
  "3bet": "♦",
  icm: "⚑",
  postflop: "⌗",
};

const POSITION_ORDER: Position[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const STACK_ORDER = [5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 75];

type Stats = { total: number; correctPct: number };

function entriesForNode(all: TopicMatrixEntry[], node: ActionNode): TopicMatrixEntry[] {
  if (node === "icm") return all.filter((e) => e.icmStage != null);
  return all.filter((e) => e.node === node);
}

export function MatrixSelector({ entries }: { entries: TopicMatrixEntry[] }) {
  const [node, setNode] = useState<ActionNode>("push-fold-jam");
  const [statsByTopic, setStatsByTopic] = useState<Record<string, Stats>>({});

  useEffect(() => {
    const s: Record<string, Stats> = {};
    for (const e of entries) {
      const p = loadProgress(e.topic.id);
      const sum = summarize(p);
      s[e.topic.id] = { total: sum.total, correctPct: sum.correctPct };
    }
    setStatsByTopic(s);
  }, [entries]);

  const countByNode = useMemo(() => {
    const counts: Record<ActionNode, number> = {
      "push-fold-jam": 0,
      "push-fold-call": 0,
      open: 0,
      "3bet": 0,
      postflop: 0,
      icm: 0,
    };
    for (const n of NODE_ORDER) counts[n] = entriesForNode(entries, n).length;
    return counts;
  }, [entries]);

  const current = useMemo(() => entriesForNode(entries, node), [entries, node]);

  const positions = useMemo(() => {
    const seen = new Set<Position>();
    for (const e of current) if (e.heroPos !== "ANY") seen.add(e.heroPos);
    return POSITION_ORDER.filter((p) => seen.has(p));
  }, [current]);

  const stacks = useMemo(() => {
    const seen = new Set<number>();
    for (const e of current) if (e.effectiveBB != null) seen.add(e.effectiveBB);
    return STACK_ORDER.filter((s) => seen.has(s));
  }, [current]);

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Nó de ação" className="flex flex-wrap gap-2">
        {NODE_ORDER.map((n) => {
          const count = countByNode[n];
          const active = n === node;
          const disabled = count === 0;
          return (
            <button
              type="button"
              key={n}
              role="tab"
              aria-selected={active}
              aria-controls="matrix-panel"
              onClick={() => setNode(n)}
              disabled={disabled}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                active
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white",
                disabled && "cursor-not-allowed opacity-40 hover:bg-slate-800/50",
              )}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {NODE_ICON[n]}
              </span>
              <span>{ACTION_NODE_LABEL[n]}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                  active
                    ? "bg-emerald-900/40 text-emerald-100"
                    : "bg-slate-900/70 text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div id="matrix-panel" role="tabpanel">
        {node === "postflop" || node === "icm" ? (
          <PostflopList entries={current} stats={statsByTopic} showIcmTag={node === "icm"} />
        ) : (
          <MatrixGrid
            entries={current}
            positions={positions}
            stacks={stacks}
            stats={statsByTopic}
          />
        )}
      </div>
    </div>
  );
}

function MatrixGrid({
  entries,
  positions,
  stacks,
  stats,
}: {
  entries: TopicMatrixEntry[];
  positions: Position[];
  stacks: number[];
  stats: Record<string, Stats>;
}) {
  if (entries.length === 0) {
    return <EmptyState />;
  }
  // Cells may host both a chipEV and an ICM topic at the same (pos, stack).
  // Today this won't collide, but in the future we'd want both side-by-side;
  // for now, prefer the chipEV entry as the primary and show an ICM badge.
  function cellAt(pos: Position, stack: number) {
    const here = entries.filter((e) => e.heroPos === pos && e.effectiveBB === stack);
    if (here.length === 0) return null;
    const primary = here.find((e) => e.icmStage == null) ?? here[0];
    const icmTwin = here.find((e) => e.icmStage != null && e !== primary);
    return { primary, icmTwin };
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="w-16 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Stack
            </th>
            {positions.map((p) => (
              <th
                key={p}
                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {POSITION_LABEL_PT[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stacks.map((s) => (
            <tr key={s}>
              <th className="pr-2 text-right font-mono text-xs font-medium tabular-nums text-slate-400">
                {s} BB
              </th>
              {positions.map((p) => {
                const found = cellAt(p, s);
                if (!found) {
                  return (
                    <td
                      key={p}
                      className="rounded-lg bg-slate-900/30 px-2 py-3 text-center"
                    >
                      <span aria-label="sem dados" className="text-slate-700">
                        —
                      </span>
                    </td>
                  );
                }
                return (
                  <td key={p} className="align-top">
                    <MatrixCell
                      entry={found.primary}
                      stats={stats[found.primary.topic.id]}
                    />
                    {found.icmTwin && (
                      <div className="mt-1">
                        <MatrixCell
                          entry={found.icmTwin}
                          stats={stats[found.icmTwin.topic.id]}
                          compact
                        />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatrixCell({
  entry,
  stats,
  compact = false,
}: {
  entry: TopicMatrixEntry;
  stats: Stats | undefined;
  compact?: boolean;
}) {
  const st = stats ?? { total: 0, correctPct: 0 };
  const isIcm = entry.icmStage != null;
  const stack = entry.effectiveBB;
  // heroPos === "ANY" only happens for postflop entries (which render in the
  // list, not in this cell), so the null branch is a defensive fallback.
  const pos = entry.heroPos !== "ANY" ? entry.heroPos : null;
  const widthPct = st.total > 0 ? Math.min(100, Math.max(0, st.correctPct)) : 0;
  return (
    <Link
      href={`/treino/${entry.topic.slug}`}
      aria-label={`Treinar ${entry.topic.title}${
        st.total > 0 ? ` — ${formatPct(st.correctPct)} de acerto em ${st.total} tentativas` : ""
      }`}
      className={cn(
        "group relative flex min-h-[60px] flex-col items-center justify-between overflow-hidden rounded-lg border text-center transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
        compact ? "px-2 py-1.5" : "px-2 py-2",
        isIcm
          ? "border-amber-700/60 bg-gradient-to-br from-amber-950 to-amber-900/70 hover:border-amber-400"
          : "border-emerald-900/40 bg-emerald-950/50 hover:border-emerald-500 hover:bg-emerald-900/60",
      )}
    >
      {isIcm && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 rounded-sm bg-amber-500/90 px-1 py-0 text-[8px] font-bold uppercase leading-tight tracking-wider text-amber-950 shadow-sm"
        >
          ICM
        </span>
      )}
      {!compact && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Treinar
        </span>
      )}
      <span
        className={cn(
          "flex items-center justify-center gap-1 font-mono font-bold tabular-nums",
          compact ? "text-xs" : "text-base",
          isIcm ? "text-amber-100" : "text-emerald-100",
        )}
      >
        <span>{pos ?? (compact ? "ICM" : "—")}</span>
        {stack != null && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium normal-case text-slate-400">
            <ChipIcon className="h-3 w-3" />
            {stack}
          </span>
        )}
      </span>
      <span className="mt-0.5 font-mono text-[10px] tabular-nums text-slate-400">
        {st.total > 0 ? `${formatPct(st.correctPct)} · ${st.total}` : "—"}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 bg-slate-900/60"
      >
        <span
          className={cn(
            "block h-full transition-all duration-500 motion-reduce:transition-none",
            isIcm ? "bg-amber-400" : "bg-emerald-500",
          )}
          style={{ width: `${widthPct}%` }}
        />
      </span>
    </Link>
  );
}

function PostflopList({
  entries,
  stats,
  showIcmTag,
}: {
  entries: TopicMatrixEntry[];
  stats: Record<string, Stats>;
  showIcmTag: boolean;
}) {
  if (entries.length === 0) return <EmptyState />;
  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const st = stats[e.topic.id] ?? { total: 0, correctPct: 0 };
        const tag =
          showIcmTag && e.icmStage
            ? e.icmStage === "bubble"
              ? "Bolha"
              : "Final Table"
            : null;
        const isIcm = e.icmStage != null;
        const pos = e.heroPos !== "ANY" ? POSITION_LABEL_PT[e.heroPos] : null;
        const stack = e.effectiveBB;
        return (
          <li key={e.topic.id}>
            <Link
              href={`/treino/${e.topic.slug}`}
              className={cn(
                "group flex min-h-[64px] items-center gap-3 rounded-xl border p-4 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                isIcm
                  ? "border-amber-800/50 bg-amber-950/30 hover:border-amber-500"
                  : "border-slate-800 bg-slate-900 hover:border-emerald-500",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl font-bold",
                  isIcm
                    ? "bg-amber-900/40 text-amber-200"
                    : "bg-emerald-900/40 text-emerald-200",
                )}
              >
                {isIcm ? "⚑" : "⌗"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{e.topic.title}</span>
                  {tag && (
                    <span className="rounded-full bg-amber-800/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      {tag}
                    </span>
                  )}
                  {pos && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tabular-nums text-slate-300">
                      {pos}
                    </span>
                  )}
                  {stack != null && (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-slate-300">
                      <ChipIcon className="h-3 w-3" />
                      {stack} BB
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-400">
                  {e.topic.description}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <AccuracyPill total={st.total} pct={st.correctPct} isIcm={isIcm} />
                <div className="mt-1 text-[10px] text-slate-500">
                  {st.total} tentativas
                </div>
              </div>
              <ChevronRightIcon
                className="h-5 w-5 shrink-0 text-slate-500 transition-colors group-hover:text-emerald-400 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AccuracyPill({
  total,
  pct,
  isIcm,
}: {
  total: number;
  pct: number;
  isIcm: boolean;
}) {
  if (total === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-400">
        —
      </span>
    );
  }
  // Three buckets matching the rest of the app's perf palette.
  const tone =
    pct >= 75
      ? "bg-emerald-900/60 text-emerald-200"
      : pct >= 50
        ? "bg-amber-900/60 text-amber-200"
        : "bg-rose-900/60 text-rose-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
        isIcm ? "bg-amber-900/60 text-amber-200" : tone,
      )}
    >
      {formatPct(pct)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-3xl text-slate-500"
      >
        ♣
      </span>
      <p className="text-sm text-slate-400">
        Sem dados para esta seção ainda — em breve.
      </p>
    </div>
  );
}

function ChipIcon({ className }: { className?: string }) {
  // Tiny chip-stack glyph: two stacked discs with side notches. Inline so we
  // don't pull a new dep and so currentColor inherits from the parent text.
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="8" cy="11" rx="5" ry="1.6" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="8" cy="7" rx="5" ry="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3 7v4M13 7v4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} {...rest}>
      <path
        d="M7.5 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
