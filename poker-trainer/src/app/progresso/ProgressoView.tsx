"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ActionKind, Card as CardModel, Rank, Suit } from "@/domain/cards";
import { ACTION_LABEL_PT } from "@/domain/cards";
import type { Attempt, TopicProgress } from "@/domain/progress";
import { summarize } from "@/domain/progress";
import type { DrillType } from "@/domain/topics";
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
  drillType: DrillType;
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

/* ─────────── category definitions ─────────── */

type CategoryDef = {
  id: string;
  label: string;
  description: string;
  predicate: (t: TopicMeta) => boolean;
};

const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: "pushfold",
    label: "Push/Fold chipEV",
    description: "Jam ou fold por stack sem pressão de payout",
    predicate: (t) => t.drillType === "pushfold" && !t.id.startsWith("icm"),
  },
  {
    id: "icm",
    label: "Push/Fold ICM",
    description: "Bolha e final table com saltos de payout em jogo",
    predicate: (t) => t.id.startsWith("icm"),
  },
  {
    id: "open",
    label: "Abertura",
    description: "Open-raise por posição com diferentes stacks",
    predicate: (t) => t.drillType === "open",
  },
  {
    id: "defense",
    label: "Defesa / 3-bet",
    description: "Resposta a abertura: call, 3-bet ou fold",
    predicate: (t) => t.drillType === "defense",
  },
  {
    id: "postflop",
    label: "Pós-flop",
    description: "C-bet, check, raise em spots SRP e pote de 3-bet",
    predicate: (t) => t.drillType === "postflop",
  },
];

type CategoryStats = {
  def: CategoryDef;
  topics: Row[];
  totalAttempts: number;
  correctPct: number;
  avgEvLoss: number;
  tone: Tone;
};

/* ─────────── hand-class type ─────────── */

type HandClass = {
  rank: string;
  label: string;
  totalEvLoss: number;
  wrongCount: number;
  totalCount: number;
};

/* ─────────── main component ─────────── */

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

  const categoryStats = computeCategoryStats(rows, CATEGORY_DEFS);
  const recommendation = bestRecommendation(rows);
  const weaknesses = computeWeaknesses(rows).slice(0, 5);
  const handClasses = computeHandClasses(rows);

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

      {/* Recommendation */}
      {hasAnyData && recommendation && (
        <RecommendationCard row={recommendation} />
      )}

      {/* Category breakdown */}
      <CategoryBreakdown stats={categoryStats} />

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

      {/* Hand-class patterns */}
      {totals.attempts >= 15 && handClasses.length > 0 && (
        <HandClassPatterns classes={handClasses} />
      )}

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

/* ─────────── new sections ─────────── */

function RecommendationCard({ row }: { row: Row }) {
  const isWeakTopic = row.total >= 5 && (row.correctPct < 65 || row.avgEvLossBB > 0.2);
  const isUnstarted = row.total === 0;
  const label = isWeakTopic
    ? "Maior gap identificado — treinar agora"
    : isUnstarted
      ? "Próxima área para explorar"
      : "Próximo treino recomendado";

  return (
    <section
      aria-label="Recomendação de treino"
      className="rounded-xl border border-emerald-900/50 bg-gradient-to-r from-emerald-950/40 to-slate-900/20 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            {label}
          </div>
          <div className="mt-1 text-lg font-bold text-white">{row.topic.title}</div>
          {row.total > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>{formatPct(row.correctPct)} acerto</span>
              <span className="text-slate-600">·</span>
              <span>EV {formatBB(row.avgEvLossBB)} perdido/mão</span>
              <span className="text-slate-600">·</span>
              <span>{row.total} tentativas</span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-400">Ainda não iniciado</div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/sessao/${row.topic.slug}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span aria-hidden="true">⏱</span> Sessão de 10 mãos
          </Link>
          <Link
            href={`/treino/${row.topic.slug}`}
            className="inline-flex min-h-10 items-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 shadow hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Modo livre
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoryBreakdown({ stats }: { stats: CategoryStats[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">Por categoria</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <CategoryCard key={s.def.id} stats={s} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ stats }: { stats: CategoryStats }) {
  const borderColor = {
    muted: "border-slate-800",
    good: "border-emerald-800/50",
    warn: "border-amber-800/50",
    bad: "border-rose-800/50",
  }[stats.tone];
  const bgColor = {
    muted: "bg-slate-900/40",
    good: "bg-emerald-950/20",
    warn: "bg-amber-950/20",
    bad: "bg-rose-950/20",
  }[stats.tone];
  const barColor = {
    muted: "bg-slate-700",
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-rose-500",
  }[stats.tone];
  const statusLabel =
    stats.totalAttempts === 0
      ? "Não iniciado"
      : stats.tone === "good"
        ? "Sólido"
        : stats.tone === "warn"
          ? "Em progresso"
          : "Precisa trabalhar";
  const statusColor = {
    muted: "text-slate-500",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-rose-400",
  }[stats.tone];

  // Best topic to drill in this category: among started topics, worst score;
  // fallback to first unstarted, then first topic overall.
  const bestTarget =
    stats.topics
      .filter((r) => r.total >= 3)
      .sort(
        (a, b) =>
          (100 - a.correctPct + a.avgEvLossBB * 150) -
          (100 - b.correctPct + b.avgEvLossBB * 150),
      )
      .at(-1) ??
    stats.topics.find((r) => r.total === 0) ??
    stats.topics[0];

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", borderColor, bgColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{stats.def.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">{stats.def.description}</div>
        </div>
        <span className={cn("shrink-0 text-xs font-semibold", statusColor)}>
          {statusLabel}
        </span>
      </div>

      {stats.totalAttempts > 0 ? (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Acerto</span>
              <span className="font-mono font-semibold text-white">
                {formatPct(stats.correctPct)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn("h-full rounded-full transition-all duration-500 motion-reduce:transition-none", barColor)}
                style={{ width: `${Math.min(100, stats.correctPct)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">EV médio perdido</span>
            <span
              className={cn(
                "font-mono",
                stats.avgEvLoss < 0.1
                  ? "text-emerald-300"
                  : stats.avgEvLoss < 0.3
                    ? "text-amber-300"
                    : "text-rose-300",
              )}
            >
              {formatBB(stats.avgEvLoss)}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {stats.totalAttempts} tentativas · {stats.topics.length} tópico
            {stats.topics.length !== 1 ? "s" : ""}
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-500">
          {stats.topics.length} tópico{stats.topics.length !== 1 ? "s" : ""} disponível
          {stats.topics.length !== 1 ? "s" : ""}
        </div>
      )}

      {bestTarget && (
        <Link
          href={`/treino/${bestTarget.topic.slug}`}
          className="inline-flex min-h-9 w-full items-center justify-center rounded border border-slate-700 bg-slate-800/60 px-3 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 motion-reduce:transition-none"
        >
          {stats.totalAttempts === 0 ? "Começar →" : "Treinar →"}
        </Link>
      )}
    </div>
  );
}

function HandClassPatterns({ classes }: { classes: HandClass[] }) {
  const top = classes.slice(0, 8);
  const maxLoss = Math.max(...top.map((c) => c.totalEvLoss), 0.01);

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-white">Padrões por classe de mão</h2>
      <p className="mb-3 text-xs text-slate-500">
        Agrupado pelo rank mais alto — mostra onde você sangra mais EV de forma sistemática.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        {top.map((c, i) => {
          const wrongPct = c.totalCount > 0 ? (c.wrongCount / c.totalCount) * 100 : 0;
          const correctPct = 100 - wrongPct;
          const barWidth = (c.totalEvLoss / maxLoss) * 100;
          const tone: Tone =
            correctPct >= 70 ? "good" : correctPct >= 50 ? "warn" : "bad";
          const barColor = { good: "#10b981", warn: "#d97706", bad: "#e11d48" }[tone];
          const accentClass = {
            good: "text-emerald-300",
            warn: "text-amber-300",
            bad: "text-rose-300",
            muted: "text-slate-400",
          }[tone];
          return (
            <div
              key={c.rank}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 text-sm",
                i > 0 && "border-t border-slate-800",
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 opacity-[0.08]"
                style={{ width: `${barWidth}%`, background: barColor }}
              />
              <span className="relative w-6 shrink-0 font-mono text-base font-bold text-white">
                {c.rank}
              </span>
              <span className="relative min-w-0 flex-1 truncate text-slate-300">{c.label}</span>
              <span className={cn("relative shrink-0 text-xs font-semibold tabular-nums", accentClass)}>
                {formatPct(correctPct)} acerto
              </span>
              <span className="relative w-14 shrink-0 text-right font-mono text-xs text-slate-400 tabular-nums">
                {formatBB(c.totalEvLoss)}
              </span>
              <span className="relative w-14 shrink-0 text-right text-xs text-slate-500 tabular-nums">
                {c.totalCount} mãos
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────── existing pieces ─────────── */

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
      <ellipse cx="36" cy="58" rx="22" ry="6" fill="#0f172a" />
      <ellipse cx="36" cy="55" rx="22" ry="6" fill={`url(#${c})`} />
      <ellipse cx="36" cy="53" rx="22" ry="6" fill="#1e293b" opacity="0.4" />
      <ellipse cx="36" cy="44" rx="20" ry="5.5" fill={`url(#${b})`} />
      <ellipse cx="36" cy="42" rx="20" ry="5.5" fill="#1e293b" opacity="0.35" />
      <ellipse cx="36" cy="34" rx="18" ry="5" fill={`url(#${a})`} />
      <ellipse cx="36" cy="32" rx="18" ry="5" fill="#1e293b" opacity="0.3" />
      <ellipse cx="36" cy="30.5" rx="18" ry="5" fill={`url(#${a})`} />
      <ellipse cx="30" cy="28.5" rx="6" ry="1.2" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}

/* ─────────── helpers ─────────── */

function computeCategoryStats(rows: Row[], defs: CategoryDef[]): CategoryStats[] {
  return defs.map((def) => {
    const topics = rows.filter((r) => def.predicate(r.topic));
    const totalAttempts = topics.reduce((s, r) => s + r.total, 0);
    const totalCorrect = topics.reduce(
      (s, r) => s + Math.round((r.correctPct / 100) * r.total),
      0,
    );
    const totalEvLoss = topics.reduce((s, r) => s + r.avgEvLossBB * r.total, 0);
    const correctPct = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const avgEvLoss = totalAttempts > 0 ? totalEvLoss / totalAttempts : 0;
    const tone: Tone =
      totalAttempts < 5
        ? "muted"
        : correctPct >= 70
          ? "good"
          : correctPct >= 50
            ? "warn"
            : "bad";
    return { def, topics, totalAttempts, correctPct, avgEvLoss, tone };
  });
}

function bestRecommendation(rows: Row[]): Row | null {
  const withData = rows.filter((r) => r.total >= 5);
  if (withData.length === 0) {
    return rows.find((r) => r.total === 0) ?? rows[0] ?? null;
  }
  const scored = withData.map((r) => ({
    row: r,
    score: (100 - r.correctPct) * 0.6 + r.avgEvLossBB * 200 * 0.4,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.row ?? null;
}

const RANK_LABELS: Record<string, string> = {
  A: "Ases (Ax)",
  K: "Reis (Kx)",
  Q: "Damas (Qx)",
  J: "Valetes (Jx)",
  T: "Dez (Tx)",
  "9": "Noves",
  "8": "Oitos",
  "7": "Setes",
  "6": "Seis",
  "5": "Cincos",
  "4": "Quatros",
  "3": "Três",
  "2": "Dois",
};

function computeHandClasses(rows: Row[]): HandClass[] {
  const byRank = new Map<string, HandClass>();
  for (const r of rows) {
    for (const a of r.progress.attempts) {
      const rank = a.hand[0];
      if (!rank || !RANK_LABELS[rank]) continue;
      const existing = byRank.get(rank);
      if (existing) {
        existing.totalEvLoss += a.evLossBB;
        existing.totalCount++;
        if (!a.correct) existing.wrongCount++;
      } else {
        byRank.set(rank, {
          rank,
          label: RANK_LABELS[rank]!,
          totalEvLoss: a.evLossBB,
          wrongCount: a.correct ? 0 : 1,
          totalCount: 1,
        });
      }
    }
  }
  return [...byRank.values()]
    .filter((c) => c.totalCount >= 3)
    .sort((a, b) => b.totalEvLoss - a.totalEvLoss);
}

function toneFromCorrect(correctPct: number, total: number): Tone {
  if (total === 0) return "muted";
  if (correctPct > 70) return "good";
  if (correctPct >= 40) return "warn";
  return "bad";
}

function toneCopy(tone: Tone, kind: "acerto" | "ev"): string {
  if (kind === "acerto") {
    switch (tone) {
      case "good": return "Sólido — segue assim";
      case "warn": return "Tem espaço pra apertar";
      case "bad": return "Foco aqui";
      default: return "Início da sessão";
    }
  }
  switch (tone) {
    case "good": return "Vazamento mínimo";
    case "warn": return "Vazamento moderado";
    case "bad": return "Vazamento alto";
    default: return "Início da sessão";
  }
}

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
