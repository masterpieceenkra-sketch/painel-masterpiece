"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { listRanges } from "@/data";
import { RangeGrid } from "@/components/RangeGrid";
import { cn } from "@/lib/cn";

// `listRanges()` returns a stable module-level array, so it's safe to grab
// once at module load — no need to wrap in useMemo. Computing the filter
// classification once here also keeps the per-keystroke filter cheap.
const ALL_RANGES = listRanges();

type FilterKey = "all" | "pushfold" | "open" | "3bet" | "icm";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pushfold", label: "Push/Fold" },
  { key: "open", label: "Open RFI" },
  { key: "3bet", label: "3-bet" },
  { key: "icm", label: "ICM" },
];

/**
 * Classify a range into one of the filter buckets by its id prefix. This
 * matches the data convention used in `src/data/ranges/`: ids start with
 * `nash-`, `open-`, `3bet-`, `def-`, or `icm-`. Kept here (not in the data
 * layer) because the bucketing is a UI-only concern — drills don't need it.
 */
function classify(id: string): Exclude<FilterKey, "all"> {
  if (id.startsWith("icm-")) return "icm";
  if (id.startsWith("3bet-") || id.startsWith("def-")) return "3bet";
  if (id.startsWith("open-")) return "open";
  // `nash-*` ranges are all push/fold (jam or call-vs-jam).
  return "pushfold";
}

export default function RangesIndexPage() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return ALL_RANGES;
    return ALL_RANGES.filter((r) => classify(r.id) === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-emerald-400 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Ranges</h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualizações 13×13 das ranges usadas pelos drills. Cores indicam ação dominante;
          células divididas indicam mix.
        </p>
      </div>

      {/* Filter toggles. Each pill is a 44×44-target-friendly button with
          focus-visible ring and aria-pressed for screen readers. */}
      <div
        role="toolbar"
        aria-label="Filtrar ranges"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filtrar:
        </span>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex min-h-[36px] items-center rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "motion-reduce:transition-none",
                active
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-slate-100",
              )}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {filtered.length} {filtered.length === 1 ? "range" : "ranges"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          Nenhuma range nesta categoria.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/ranges/${r.id}`}
                title={`${r.label} — ${r.description} · ${r.effectiveBB} BB`}
                className={cn(
                  "group flex h-full gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 outline-none transition-colors",
                  "hover:border-emerald-500",
                  "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  "motion-reduce:transition-none",
                )}
              >
                {/* 13×13 thumbnail. Fixed width so it doesn't stretch on wide
                    cards; the text takes the remaining space. */}
                <div className="w-20 shrink-0 sm:w-24">
                  <RangeGrid range={r} size="thumb" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-white">{r.label}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">
                      {r.effectiveBB} BB
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400 group-hover:line-clamp-none">
                    {r.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
