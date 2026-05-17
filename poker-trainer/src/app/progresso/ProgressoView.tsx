"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ActionKind } from "@/domain/cards";
import { ACTION_LABEL_PT } from "@/domain/cards";
import type { Attempt, TopicProgress } from "@/domain/progress";
import { summarize } from "@/domain/progress";
import { exportAll, importAll } from "@/storage/exportImport";
import { loadProgress, resetProgress } from "@/storage/localProgress";
import { cn } from "@/lib/cn";
import { formatBB, formatPct } from "@/lib/format";
import { relativeTime } from "@/lib/relativeTime";

type TopicMeta = {
  id: string;
  title: string;
  slug: string;
  targetAttempts: number;
};

type Row = {
  topic: TopicMeta;
  progress: TopicProgress;
  total: number;
  correctPct: number;
  avgEvLossBB: number;
  lastSeenMs: number | null;
};

type Weakness = {
  spotId: string;
  hand: string;
  attempts: Attempt[];
  topicId: string;
};

export function ProgressoView({ topics }: { topics: TopicMeta[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    const next: Row[] = topics.map((topic) => {
      const progress = loadProgress(topic.id);
      const s = summarize(progress);
      return {
        topic,
        progress,
        total: s.total,
        correctPct: s.correctPct,
        avgEvLossBB: s.avgEvLossBB,
        lastSeenMs: s.lastSeenMs,
      };
    });
    setRows(next);
    setNow(Date.now());
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weaknesses = computeWeaknesses(rows).slice(0, 5);
  const totals = rows.reduce(
    (acc, r) => {
      acc.attempts += r.total;
      acc.correct += Math.round((r.correctPct / 100) * r.total);
      acc.evLoss += r.avgEvLossBB * r.total;
      return acc;
    },
    { attempts: 0, correct: 0, evLoss: 0 },
  );
  const globalCorrectPct = totals.attempts > 0 ? (totals.correct / totals.attempts) * 100 : 0;
  const globalAvgEvLoss = totals.attempts > 0 ? totals.evLoss / totals.attempts : 0;

  function handleExport() {
    const payload = exportAll(topics.map((t) => t.id));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poker-trainer-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Exportado.");
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importAll(parsed);
      setMessage(
        `Importados ${result.imported} tópicos.${result.errors.length ? " Avisos: " + result.errors.join("; ") : ""}`,
      );
      refresh();
    } catch (e) {
      setMessage(`Erro: ${e instanceof Error ? e.message : "JSON inválido"}`);
    }
  }

  function handleResetAll() {
    if (!confirm("Apagar TODO o progresso local? Não dá pra desfazer.")) return;
    for (const t of topics) resetProgress(t.id);
    refresh();
    setMessage("Progresso apagado.");
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Tentativas" value={String(totals.attempts)} />
        <StatTile
          label="Acerto geral"
          value={totals.attempts > 0 ? formatPct(globalCorrectPct) : "—"}
          tone={
            totals.attempts === 0
              ? "muted"
              : globalCorrectPct >= 80
                ? "good"
                : globalCorrectPct >= 60
                  ? "warn"
                  : "bad"
          }
        />
        <StatTile
          label="EV médio perdido"
          value={totals.attempts > 0 ? formatBB(globalAvgEvLoss) : "—"}
          tone={
            totals.attempts === 0
              ? "muted"
              : globalAvgEvLoss < 0.05
                ? "good"
                : globalAvgEvLoss < 0.2
                  ? "warn"
                  : "bad"
          }
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Por tópico</h2>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-normal">Tópico</th>
                <th className="px-3 py-2 text-right font-normal">Tentativas</th>
                <th className="px-3 py-2 text-right font-normal">Acerto</th>
                <th className="px-3 py-2 text-right font-normal">EV perdido</th>
                <th className="px-3 py-2 text-right font-normal">Última</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.topic.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-3 py-2">
                    <Link
                      href={`/treino/${r.topic.slug}`}
                      className="text-slate-200 hover:text-emerald-300"
                    >
                      {r.topic.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-300">
                    {r.total}/{r.topic.targetAttempts}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      r.total === 0
                        ? "text-slate-600"
                        : r.correctPct >= 80
                          ? "text-emerald-300"
                          : r.correctPct >= 60
                            ? "text-amber-300"
                            : "text-rose-300",
                    )}
                  >
                    {r.total === 0 ? "—" : formatPct(r.correctPct)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-300">
                    {r.total === 0 ? "—" : formatBB(r.avgEvLossBB)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-slate-400">
                    {r.lastSeenMs ? relativeTime(r.lastSeenMs, now) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Fraquezas — pior EV por mão</h2>
        {weaknesses.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sem tentativas suficientes. Jogue alguns tópicos pra ver os padrões.
          </p>
        ) : (
          <ul className="space-y-2">
            {weaknesses.map((w) => {
              const totalLoss = w.attempts.reduce((s, a) => s + a.evLossBB, 0);
              const wrong = w.attempts.filter((a) => !a.correct).length;
              const dominantWrong = mostCommonWrongAction(w.attempts);
              return (
                <li
                  key={`${w.spotId}:${w.hand}`}
                  className="flex flex-wrap items-baseline justify-between gap-3 rounded border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-mono font-semibold text-white">{w.hand}</span>{" "}
                    <span className="text-slate-500">·</span>{" "}
                    <span className="text-slate-300">{w.spotId}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {wrong}/{w.attempts.length} errados
                    {dominantWrong && (
                      <>
                        {" "}
                        · vício:{" "}
                        <span className="text-rose-300">{ACTION_LABEL_PT[dominantWrong]}</span>
                      </>
                    )}{" "}
                    · perda total{" "}
                    <span className="font-mono text-rose-300">{formatBB(totalLoss)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-white">Backup</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={handleResetAll}
            className="ml-auto rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Apagar tudo
          </button>
        </div>
        {message && <p className="text-xs text-slate-400">{message}</p>}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    muted: "text-slate-300",
    good: "text-emerald-300",
    warn: "text-amber-300",
    bad: "text-rose-300",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</div>
    </div>
  );
}

function computeWeaknesses(rows: Row[]): Weakness[] {
  const byKey = new Map<string, Weakness>();
  for (const r of rows) {
    for (const a of r.progress.attempts) {
      const key = `${a.spotId}:${a.hand}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.attempts.push(a);
      } else {
        byKey.set(key, {
          spotId: a.spotId,
          hand: a.hand,
          attempts: [a],
          topicId: r.topic.id,
        });
      }
    }
  }
  return [...byKey.values()]
    .filter((w) => w.attempts.some((a) => !a.correct))
    .map((w) => ({
      ...w,
      totalLoss: w.attempts.reduce((s, a) => s + a.evLossBB, 0),
    }))
    .sort(
      (a, b) =>
        b.attempts.reduce((s, x) => s + x.evLossBB, 0) -
        a.attempts.reduce((s, x) => s + x.evLossBB, 0),
    );
}

function mostCommonWrongAction(attempts: Attempt[]): ActionKind | null {
  const counts: Partial<Record<ActionKind, number>> = {};
  for (const a of attempts) {
    if (a.correct) continue;
    counts[a.chosen.kind] = (counts[a.chosen.kind] ?? 0) + 1;
  }
  const entries = Object.entries(counts) as [ActionKind, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
