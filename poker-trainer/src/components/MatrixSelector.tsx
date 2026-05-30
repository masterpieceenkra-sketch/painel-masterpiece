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
      <div className="flex flex-wrap gap-2">
        {NODE_ORDER.map((n) => {
          const count = countByNode[n];
          const active = n === node;
          return (
            <button
              type="button"
              key={n}
              onClick={() => setNode(n)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700",
                count === 0 && "cursor-not-allowed opacity-40",
              )}
              disabled={count === 0}
            >
              {ACTION_NODE_LABEL[n]}{" "}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

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
      <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="w-16 text-left text-xs uppercase tracking-wide text-slate-500">
              Stack
            </th>
            {positions.map((p) => (
              <th
                key={p}
                className="px-2 py-1 text-xs uppercase tracking-wide text-slate-500"
              >
                {POSITION_LABEL_PT[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stacks.map((s) => (
            <tr key={s}>
              <th className="text-right text-xs font-mono text-slate-400">{s} BB</th>
              {positions.map((p) => {
                const found = cellAt(p, s);
                if (!found) {
                  return (
                    <td key={p} className="rounded bg-slate-900/30 px-2 py-3 text-center">
                      <span className="text-slate-700">—</span>
                    </td>
                  );
                }
                const e = found.primary;
                const st = stats[e.topic.id] ?? { total: 0, correctPct: 0 };
                const isIcm = e.icmStage != null;
                return (
                  <td key={p}>
                    <Link
                      href={`/treino/${e.topic.slug}`}
                      className={cn(
                        "block rounded border px-2 py-2 text-center transition-colors",
                        isIcm
                          ? "border-amber-800/60 bg-amber-950/40 hover:border-amber-500"
                          : "border-emerald-900/40 bg-emerald-950/50 hover:border-emerald-500 hover:bg-emerald-900/60",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-semibold",
                          isIcm ? "text-amber-200" : "text-emerald-200",
                        )}
                      >
                        Treinar{isIcm ? " · ICM" : ""}
                      </div>
                      <div className="mt-0.5 text-[10px] font-mono text-slate-400">
                        {st.total > 0 ? formatPct(st.correctPct) : "—"} · {st.total}
                      </div>
                    </Link>
                    {found.icmTwin && (
                      <Link
                        href={`/treino/${found.icmTwin.topic.slug}`}
                        className="mt-1 block rounded border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-center text-[10px] font-semibold text-amber-200 hover:border-amber-500"
                      >
                        + ICM
                      </Link>
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
        const tag = showIcmTag && e.icmStage ? (e.icmStage === "bubble" ? "Bolha" : "Final Table") : null;
        return (
          <li key={e.topic.id}>
            <Link
              href={`/treino/${e.topic.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-emerald-500"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{e.topic.title}</span>
                  {tag && (
                    <span className="rounded-full bg-amber-800/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
                      {tag}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{e.topic.description}</div>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                {st.total > 0 ? formatPct(st.correctPct) : "—"}
                <div className="text-[10px]">{st.total} tentativas</div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
      Sem dados para esta seção ainda.
    </div>
  );
}
