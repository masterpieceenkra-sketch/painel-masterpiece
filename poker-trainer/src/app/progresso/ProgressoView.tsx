"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ActionKind, Card as CardModel, Rank, Suit } from "@/domain/cards";
import { ACTION_LABEL_PT } from "@/domain/cards";
import type { Attempt, TopicProgress } from "@/domain/progress";
import { summarize } from "@/domain/progress";
import { Card } from "@/components/Card";
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

type Tone = "muted" | "good" | "warn" | "bad";

export function ProgressoView({ topics }: { topics: TopicMeta[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const fileRef = useRef<HTMLInputElement>(null);
  const importingRef = useRef(false);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashMessage(text: string) {
    setMessage(text);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 5000);
  }

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

  // Tick `now` every 30s and on tab focus so relative "Última" timestamps
  // don't drift when the page sits open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    function onFocus() {
      setNow(Date.now());
      refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
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
  const hasAnyData = totals.attempts > 0;

  function handleExport() {
    const payload = exportAll(topics.map((t) => t.id));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poker-trainer-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage("Exportado.");
  }

  async function handleImport(file: File) {
    if (importingRef.current) {
      flashMessage("Aguarde — já há um import em andamento.");
      return;
    }
    importingRef.current = true;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importAll(parsed, importMode);
      const modeLabel = importMode === "merge" ? "mesclados" : "substituídos";
      flashMessage(
        `Importados ${result.imported} tópicos (${modeLabel}).${result.errors.length ? " Avisos: " + result.errors.join("; ") : ""}`,
      );
      refresh();
    } catch (e) {
      flashMessage(`Erro: ${e instanceof Error ? e.message : "JSON inválido"}`);
    } finally {
      importingRef.current = false;
    }
  }

  function handleResetAll() {
    if (!confirm("Apagar TODO o progresso local? Não dá pra desfazer.")) return;
    for (const t of topics) resetProgress(t.id);
    refresh();
    flashMessage("Progresso apagado.");
  }

  const overallTone: Tone = !hasAnyData
    ? "muted"
    : globalCorrectPct >= 80
      ? "good"
      : globalCorrectPct >= 60
        ? "warn"
        : "bad";
  const evTone: Tone = !hasAnyData
    ? "muted"
    : globalAvgEvLoss < 0.05
      ? "good"
      : globalAvgEvLoss < 0.2
        ? "warn"
        : "bad";

  return (
    <div className="space-y-8">
      {/* Hero stat tiles */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Tentativas"
          value={String(totals.attempts)}
          tone={hasAnyData ? "good" : "muted"}
          trend={hasAnyData ? "Total acumulado" : "Início da sessão"}
          icon={<TargetIcon />}
        />
        <StatTile
          label="Acerto geral"
          value={hasAnyData ? formatPct(globalCorrectPct) : "—"}
          tone={overallTone}
          trend={hasAnyData ? toneCopy(overallTone, "acerto") : "Início da sessão"}
          icon={<CheckIcon />}
        />
        <StatTile
          label="EV médio perdido"
          value={hasAnyData ? formatBB(globalAvgEvLoss) : "—"}
          tone={evTone}
          trend={hasAnyData ? toneCopy(evTone, "ev") : "Início da sessão"}
          icon={<ChipsIcon />}
        />
      </section>

      {!hasAnyData && <EmptyState />}

      {/* Per-topic */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Por tópico</h2>

        {/* Mobile: card stack */}
        <ul className="space-y-2 sm:hidden">
          {rows.map((r) => (
            <TopicCard key={r.topic.id} row={r} now={now} />
          ))}
        </ul>

        {/* Desktop: card-row table */}
        <div className="hidden sm:block">
          <div role="table" className="overflow-hidden rounded-lg border border-slate-800">
            <div
              role="row"
              className="grid grid-cols-[1.4fr_auto_auto_auto_auto_auto] items-center gap-3 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-wide text-slate-500"
            >
              <span>Tópico</span>
              <span className="text-right">Tentativas</span>
              <span className="text-right">Acerto</span>
              <span className="text-right">EV perdido</span>
              <span className="text-center">Tendência</span>
              <span className="text-right">Última</span>
            </div>
            {rows.map((r, idx) => {
              const tone = toneFromCorrect(r.correctPct, r.total);
              const last20 = r.progress.attempts.slice(-20).map((a) => (a.correct ? 1 : 0));
              return (
                <div
                  key={r.topic.id}
                  role="row"
                  className={cn(
                    "grid grid-cols-[1.4fr_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-900/40 motion-reduce:transition-none",
                    idx > 0 && "border-t border-slate-800",
                  )}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/treino/${r.topic.slug}`}
                      className="block truncate rounded text-slate-100 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                    >
                      {r.topic.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <PositionStackBadge topicId={r.topic.id} />
                    </div>
                  </div>
                  <Pill tone="neutral" className="font-mono">
                    {r.total}/{r.topic.targetAttempts}
                  </Pill>
                  <Pill tone={tone} className="font-mono">
                    {r.total === 0 ? "—" : formatPct(r.correctPct)}
                  </Pill>
                  <span
                    className={cn(
                      "text-right font-mono tabular-nums",
                      r.total === 0 ? "text-slate-600" : "text-slate-300",
                    )}
                  >
                    {r.total === 0 ? "—" : formatBB(r.avgEvLossBB)}
                  </span>
                  <Sparkline values={last20} tone={tone} />
                  <Pill tone="ghost" className="text-xs">
                    {r.lastSeenMs ? relativeTime(r.lastSeenMs, now) : "—"}
                  </Pill>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fraquezas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Fraquezas — pior EV por mão</h2>
        {weaknesses.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sem tentativas suficientes. Joga alguns tópicos pra ver os padrões.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weaknesses.map((w) => {
              const totalLoss = w.attempts.reduce((s, a) => s + a.evLossBB, 0);
              const wrong = w.attempts.filter((a) => !a.correct).length;
              const dominantWrong = mostCommonWrongAction(w.attempts);
              const sampleCards = handToSampleCards(w.hand);
              return (
                <li
                  key={`${w.spotId}:${w.hand}`}
                  className="group relative overflow-hidden rounded-lg border border-rose-900/40 bg-gradient-to-br from-slate-900 to-slate-900/40 p-4 transition-colors hover:border-rose-700/60 motion-reduce:transition-none"
                >
                  <div className="flex items-start gap-3">
                    {sampleCards && (
                      <div
                        aria-hidden="true"
                        className="flex shrink-0 items-center gap-1 pt-1"
                      >
                        {sampleCards.map((c, i) => (
                          <Card
                            key={i}
                            card={c}
                            size="sm"
                            className={cn(i === 1 && "-ml-3 rotate-3")}
                          />
                        ))}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-2xl font-bold tabular-nums text-white">
                          {w.hand}
                        </span>
                        <span className="font-mono text-sm tabular-nums text-rose-300">
                          {formatBB(totalLoss)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500" title={w.spotId}>
                        {w.spotId}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Pill tone="bad" className="text-xs">
                          {wrong}/{w.attempts.length} errados
                        </Pill>
                        {dominantWrong && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-rose-900/60 bg-rose-950/60 px-2 py-0.5 text-xs text-rose-300"
                            title="Ação errada mais escolhida"
                          >
                            <span className="text-rose-500">vício:</span>
                            {ACTION_LABEL_PT[dominantWrong]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Backup */}
      <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Backup</h2>
          <p className="text-xs text-slate-500">Exportar/Importar JSON do seu progresso</p>
        </div>

        {/* Row: export + import + segmented mode */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 motion-reduce:transition-none"
          >
            <DownloadIcon />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none"
          >
            <UploadIcon />
            Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (
                  importMode === "replace" &&
                  !confirm(
                    "Modo Substituir vai apagar o progresso local de cada tópico presente no arquivo. Continuar?",
                  )
                ) {
                  e.target.value = "";
                  return;
                }
                handleImport(f);
              }
              e.target.value = "";
            }}
          />

          <SegmentedMode value={importMode} onChange={setImportMode} />

          <button
            type="button"
            onClick={handleResetAll}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-800/70 bg-rose-700/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 motion-reduce:transition-none"
          >
            <TrashIcon />
            Apagar tudo
          </button>
        </div>

        <p className="text-xs text-slate-500">
          <strong className="text-slate-300">Mesclar</strong> adiciona apenas tentativas novas
          (dedupe por timestamp+spot+mão). <strong className="text-slate-300">Substituir</strong>{" "}
          apaga o que estiver local pra esses tópicos e usa só o arquivo. Default: Mesclar.
        </p>

        {/* Confirmation banner */}
        <div
          aria-live="polite"
          className={cn(
            "overflow-hidden transition-all duration-300 motion-reduce:transition-none",
            message ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {message && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
              <InfoIcon />
              <span>{message}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ─────────── pieces ─────────── */

function StatTile({
  label,
  value,
  tone = "muted",
  trend,
  icon,
}: {
  label: string;
  value: string;
  tone?: Tone;
  trend?: string;
  icon?: React.ReactNode;
}) {
  const toneClass = {
    muted: "text-slate-200",
    good: "text-emerald-300",
    warn: "text-amber-300",
    bad: "text-rose-300",
  }[tone];
  const borderTone = {
    muted: "from-slate-700/40 to-slate-800/40",
    good: "from-emerald-500/40 to-emerald-700/20",
    warn: "from-amber-500/40 to-amber-700/20",
    bad: "from-rose-500/40 to-rose-700/20",
  }[tone];
  const iconTone = {
    muted: "text-slate-500",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-rose-400",
  }[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br p-[1px]",
        borderTone,
      )}
    >
      <div className="rounded-[calc(0.75rem-1px)] bg-slate-950/90 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className={iconTone} aria-hidden="true">
            {icon}
          </div>
        </div>
        <div className={cn("mt-2 font-mono text-4xl font-bold tabular-nums", toneClass)}>
          {value}
        </div>
        {trend && <div className="mt-1 text-xs text-slate-500">{trend}</div>}
      </div>
    </div>
  );
}

function TopicCard({ row, now }: { row: Row; now: number }) {
  const tone = toneFromCorrect(row.correctPct, row.total);
  const last20 = row.progress.attempts.slice(-20).map((a) => (a.correct ? 1 : 0));
  return (
    <li>
      <Link
        href={`/treino/${row.topic.slug}`}
        className="block rounded-lg border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 motion-reduce:transition-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{row.topic.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <PositionStackBadge topicId={row.topic.id} />
            </div>
          </div>
          <Sparkline values={last20} tone={tone} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Pill tone="neutral" className="font-mono">
            {row.total}/{row.topic.targetAttempts}
          </Pill>
          <Pill tone={tone} className="font-mono">
            {row.total === 0 ? "—" : formatPct(row.correctPct)}
          </Pill>
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              row.total === 0 ? "text-slate-600" : "text-slate-400",
            )}
          >
            {row.total === 0 ? "—" : `EV ${formatBB(row.avgEvLossBB)}`}
          </span>
          <Pill tone="ghost" className="ml-auto text-xs">
            {row.lastSeenMs ? relativeTime(row.lastSeenMs, now) : "—"}
          </Pill>
        </div>
      </Link>
    </li>
  );
}

function Pill({
  tone,
  className,
  children,
}: {
  tone: Tone | "neutral" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const map = {
    neutral: "border-slate-700/70 bg-slate-800/70 text-slate-200",
    ghost: "border-transparent bg-transparent text-slate-400",
    muted: "border-slate-700/70 bg-slate-800/70 text-slate-400",
    good: "border-emerald-700/60 bg-emerald-950/60 text-emerald-300",
    warn: "border-amber-700/60 bg-amber-950/60 text-amber-300",
    bad: "border-rose-700/60 bg-rose-950/60 text-rose-300",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs tabular-nums",
        map[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

function PositionStackBadge({ topicId }: { topicId: string }) {
  const meta = parseTopicMeta(topicId);
  if (!meta) return null;
  return (
    <>
      {meta.position && (
        <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-300">
          {meta.position}
        </span>
      )}
      {meta.stack && (
        <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
          {meta.stack}
        </span>
      )}
    </>
  );
}

function SegmentedMode({
  value,
  onChange,
}: {
  value: "merge" | "replace";
  onChange: (v: "merge" | "replace") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo de importação"
      className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-0.5"
    >
      <SegmentButton
        active={value === "merge"}
        onClick={() => onChange("merge")}
        label="Mesclar"
        activeColor="bg-emerald-600 text-white"
      />
      <SegmentButton
        active={value === "replace"}
        onClick={() => onChange("replace")}
        label="Substituir"
        activeColor="bg-rose-600 text-white"
      />
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 motion-reduce:transition-none",
        active ? activeColor : "text-slate-300 hover:text-slate-100",
      )}
    >
      {label}
    </button>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: Tone }) {
  const w = 80;
  const h = 20;
  const stroke = {
    muted: "stroke-slate-600",
    good: "stroke-emerald-400",
    warn: "stroke-amber-400",
    bad: "stroke-rose-400",
  }[tone];
  if (values.length === 0) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="text-slate-700"
        aria-hidden="true"
      >
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="currentColor"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      </svg>
    );
  }
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  const pad = 2;
  const points = values
    .map((v, i) => {
      const x = values.length === 1 ? w / 2 : i * stepX;
      const y = v === 1 ? pad : h - pad;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn(stroke)}
      aria-hidden="true"
      role="img"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/30 px-6 py-10 text-center">
      <ChipsStackIllustration />
      <p className="max-w-sm text-sm text-slate-400">
        Sem tentativas ainda. Vai treinar alguns drills e volta — você vai ver onde precisa
        apertar.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 motion-reduce:transition-none"
      >
        Começar treino
      </Link>
    </div>
  );
}

/* ─────────── icons ─────────── */

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

function ChipsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="7" rx="7" ry="2.4" />
      <path d="M5 7v4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V7" />
      <path d="M5 11v4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20V8" />
      <path d="M7 13l5-5 5 5" />
      <path d="M5 4h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v5h1" />
    </svg>
  );
}

function ChipsStackIllustration() {
  // Scoped gradient IDs to avoid collisions if other SVGs on the page use the same names.
  const a = "progresso-chip-a";
  const b = "progresso-chip-b";
  const c = "progresso-chip-c";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={a} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id={b} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id={c} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f43f5e" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      {/* bottom chip */}
      <ellipse cx="36" cy="58" rx="22" ry="6" fill="#0f172a" />
      <ellipse cx="36" cy="55" rx="22" ry="6" fill={`url(#${c})`} />
      <ellipse cx="36" cy="53" rx="22" ry="6" fill="#1e293b" opacity="0.4" />
      {/* middle chip */}
      <ellipse cx="36" cy="44" rx="20" ry="5.5" fill={`url(#${b})`} />
      <ellipse cx="36" cy="42" rx="20" ry="5.5" fill="#1e293b" opacity="0.35" />
      {/* top chip */}
      <ellipse cx="36" cy="34" rx="18" ry="5" fill={`url(#${a})`} />
      <ellipse cx="36" cy="32" rx="18" ry="5" fill="#1e293b" opacity="0.3" />
      <ellipse cx="36" cy="30.5" rx="18" ry="5" fill={`url(#${a})`} />
      {/* highlight */}
      <ellipse cx="30" cy="28.5" rx="6" ry="1.2" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}

/* ─────────── helpers ─────────── */

function toneFromCorrect(correctPct: number, total: number): Tone {
  if (total === 0) return "muted";
  if (correctPct > 70) return "good";
  if (correctPct >= 40) return "warn";
  return "bad";
}

function toneCopy(tone: Tone, kind: "acerto" | "ev"): string {
  if (kind === "acerto") {
    switch (tone) {
      case "good":
        return "Sólido — segue assim";
      case "warn":
        return "Tem espaço pra apertar";
      case "bad":
        return "Foco aqui";
      default:
        return "Início da sessão";
    }
  }
  switch (tone) {
    case "good":
      return "Vazamento mínimo";
    case "warn":
      return "Vazamento moderado";
    case "bad":
      return "Vazamento alto";
    default:
      return "Início da sessão";
  }
}

// Parse "pf-sb-vs-bb-10bb-base", "open-btn-25bb-base", "icm-bubble-sb-jam-15bb-base"
// to extract a position label and a stack label.
function parseTopicMeta(id: string): { position: string | null; stack: string | null } | null {
  if (!id) return null;
  const POS = ["utg1", "utg", "mp", "lj", "hj", "co", "btn", "sb", "bb"];
  const lower = id.toLowerCase();
  const tokens = lower.split(/[-_]/);
  let position: string | null = null;
  for (const t of tokens) {
    if (POS.includes(t)) {
      position = t.toUpperCase();
      break;
    }
  }
  let stack: string | null = null;
  const stackMatch = lower.match(/(\d{1,3})bb/);
  if (stackMatch) stack = `${stackMatch[1]}BB`;
  if (!position && !stack) return null;
  return { position, stack };
}

// Map a hand code (e.g., "AKs", "AKo", "AA", "T9s") to up to 2 sample cards.
function handToSampleCards(hand: string): CardModel[] | null {
  if (!hand || hand.length < 2 || hand.length > 3) return null;
  const r1 = hand[0] as Rank;
  const r2 = hand[1] as Rank;
  const VALID_RANKS = "23456789TJQKA";
  if (!VALID_RANKS.includes(r1) || !VALID_RANKS.includes(r2)) return null;
  if (r1 === r2) {
    return [
      { rank: r1, suit: "s" as Suit },
      { rank: r2, suit: "h" as Suit },
    ];
  }
  const tag = hand[2];
  if (tag === "s") {
    return [
      { rank: r1, suit: "s" as Suit },
      { rank: r2, suit: "s" as Suit },
    ];
  }
  if (tag === "o") {
    return [
      { rank: r1, suit: "s" as Suit },
      { rank: r2, suit: "h" as Suit },
    ];
  }
  return null;
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
