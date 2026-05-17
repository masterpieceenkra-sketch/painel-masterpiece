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
  "postflop",
];

const POSITION_ORDER: Position[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const STACK_ORDER = [5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 75];

type Stats = { total: number; correctPct: number };

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

  const grouped = useMemo(() => {
    const byNode: Record<ActionNode, TopicMatrixEntry[]> = {
      "push-fold-jam": [],
      "push-fold-call": [],
      open: [],
      "3bet": [],
      postflop: [],
    };
    for (const e of entries) byNode[e.node].push(e);
    return byNode;
  }, [entries]);

  const current = grouped[node];

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
          const count = grouped[n].length;
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

      {node === "postflop" ? (
        <PostflopList entries={current} stats={statsByTopic} />
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
  const cell = (pos: Position, stack: number) =>
    entries.find((e) => e.heroPos === pos && e.effectiveBB === stack);
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
                const e = cell(p, s);
                if (!e) {
                  return (
                    <td key={p} className="rounded bg-slate-900/30 px-2 py-3 text-center">
                      <span className="text-slate-700">—</span>
                    </td>
                  );
                }
                const st = stats[e.topic.id] ?? { total: 0, correctPct: 0 };
                return (
                  <td key={p}>
                    <Link
                      href={`/treino/${e.topic.slug}`}
                      className="block rounded border border-emerald-900/40 bg-emerald-950/50 px-2 py-2 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-900/60"
                    >
                      <div className="text-xs font-semibold text-emerald-200">
                        Treinar
                      </div>
                      <div className="mt-0.5 text-[10px] font-mono text-slate-400">
                        {st.total > 0 ? formatPct(st.correctPct) : "—"} · {st.total}
                      </div>
                    </Link>
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
}: {
  entries: TopicMatrixEntry[];
  stats: Record<string, Stats>;
}) {
  if (entries.length === 0) return <EmptyState />;
  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const st = stats[e.topic.id] ?? { total: 0, correctPct: 0 };
        return (
          <li key={e.topic.id}>
            <Link
              href={`/treino/${e.topic.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-emerald-500"
            >
              <div>
                <div className="font-semibold text-white">{e.topic.title}</div>
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
