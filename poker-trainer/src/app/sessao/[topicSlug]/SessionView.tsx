"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PostflopSpot } from "@/domain/postflop";
import type { Attempt } from "@/domain/progress";
import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import { ACTION_LABEL_PT } from "@/domain/cards";
import { DrillRunner } from "@/app/treino/[topicSlug]/DrillRunner";
import { PostflopRunner } from "@/app/treino/[topicSlug]/PostflopRunner";
import { formatBB, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

const SESSION_SIZE = 10;

type CommonProps = {
  topicId: string;
  topicTitle: string;
  topicSlug: string;
  targetAttempts: number;
};

type PreflopProps = CommonProps & {
  kind: "preflop";
  spot: PreflopSpot;
  range: PreflopRange;
};

type PostflopProps = CommonProps & {
  kind: "postflop";
  spots: PostflopSpot[];
};

type Props = PreflopProps | PostflopProps;

export function SessionView(props: Props) {
  const [sessionAttempts, setSessionAttempts] = useState<Attempt[]>([]);
  const [startMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const sessionKey = useRef(0);

  const done = sessionAttempts.length >= SESSION_SIZE;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [done]);

  function handleAttempt(attempt: Attempt) {
    setSessionAttempts((prev) =>
      prev.length >= SESSION_SIZE ? prev : [...prev, attempt],
    );
  }

  function restart() {
    sessionKey.current += 1;
    setSessionAttempts([]);
  }

  const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));

  return (
    <div className="space-y-6">
      <SessionHeader
        topicTitle={props.topicTitle}
        topicSlug={props.topicSlug}
        completed={sessionAttempts.length}
        total={SESSION_SIZE}
        elapsedSec={elapsedSec}
        done={done}
      />

      {done ? (
        <SessionSummary
          attempts={sessionAttempts}
          topicSlug={props.topicSlug}
          elapsedSec={elapsedSec}
          onRestart={restart}
        />
      ) : (
        <div key={sessionKey.current}>
          {props.kind === "preflop" ? (
            <DrillRunner
              topicId={props.topicId}
              spot={props.spot}
              range={props.range}
              targetAttempts={props.targetAttempts}
              onAttempt={handleAttempt}
            />
          ) : (
            <PostflopRunner
              topicId={props.topicId}
              spots={props.spots}
              targetAttempts={props.targetAttempts}
              onAttempt={handleAttempt}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SessionHeader({
  topicTitle,
  topicSlug,
  completed,
  total,
  elapsedSec,
  done,
}: {
  topicTitle: string;
  topicSlug: string;
  completed: number;
  total: number;
  elapsedSec: number;
  done: boolean;
}) {
  const pct = Math.min(100, (completed / total) * 100);
  const mm = Math.floor(elapsedSec / 60);
  const ss = String(elapsedSec % 60).padStart(2, "0");
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-700/40">
            Sessão
          </span>
          <span className="text-sm text-slate-300">{topicTitle}</span>
        </div>
        <div className="flex items-baseline gap-4 text-xs">
          <span className="text-slate-400">
            Mão{" "}
            <span className="font-mono text-base font-bold text-white">
              {Math.min(completed + (done ? 0 : 1), total)}
            </span>
            <span className="text-slate-500">/{total}</span>
          </span>
          <span className="text-slate-400">
            Tempo:{" "}
            <span className="font-mono text-slate-200">
              {mm}:{ss}
            </span>
          </span>
          <Link
            href={`/treino/${topicSlug}`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Sair da sessão
          </Link>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SessionSummary({
  attempts,
  topicSlug,
  elapsedSec,
  onRestart,
}: {
  attempts: Attempt[];
  topicSlug: string;
  elapsedSec: number;
  onRestart: () => void;
}) {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const correctPct = total > 0 ? (correct / total) * 100 : 0;
  const totalEvLoss = attempts.reduce((s, a) => s + a.evLossBB, 0);
  const avgEvLoss = total > 0 ? totalEvLoss / total : 0;
  const mm = Math.floor(elapsedSec / 60);
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const avgSec = total > 0 ? Math.floor(elapsedSec / total) : 0;

  const worst = useMemo(() => {
    return attempts
      .filter((a) => !a.correct)
      .slice()
      .sort((a, b) => b.evLossBB - a.evLossBB)
      .slice(0, 5);
  }, [attempts]);

  const tone =
    correctPct >= 80
      ? { label: "Sólido — segue assim", className: "text-emerald-300" }
      : correctPct >= 60
        ? { label: "Decente — revisa as fraquezas", className: "text-amber-300" }
        : { label: "Tem vazamentos — estuda a range", className: "text-rose-300" };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-6 text-center">
        <p className="text-sm uppercase tracking-wide text-emerald-300/80">
          Sessão completa
        </p>
        <p className={cn("mt-2 text-3xl font-bold", tone.className)}>
          {tone.label}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {total} mãos em {mm}:{ss} · {avgSec}s por mão
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Acerto" value={formatPct(correctPct)} mono />
        <SummaryTile
          label="EV total perdido"
          value={formatBB(totalEvLoss)}
          mono
          accent={totalEvLoss < 0.5 ? "good" : totalEvLoss < 2 ? "warn" : "bad"}
        />
        <SummaryTile
          label="EV médio por mão"
          value={formatBB(avgEvLoss)}
          mono
          accent={avgEvLoss < 0.05 ? "good" : avgEvLoss < 0.2 ? "warn" : "bad"}
        />
      </div>

      {worst.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Top {worst.length} maiores erros da sessão
          </h2>
          <ul className="space-y-2">
            {worst.map((a, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 rounded border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm"
              >
                <span>
                  <span className="font-mono font-semibold text-white">
                    {a.hand}
                  </span>{" "}
                  <span className="text-slate-500">·</span>{" "}
                  <span className="text-slate-400">{a.spotId}</span>
                </span>
                <span className="text-xs text-slate-400">
                  você fez{" "}
                  <span className="text-rose-300">
                    {ACTION_LABEL_PT[a.chosen.kind]}
                  </span>{" "}
                  · perda{" "}
                  <span className="font-mono text-rose-300">
                    {formatBB(a.evLossBB)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-emerald-500"
        >
          Treinar mais 10 mãos
        </button>
        <Link
          href={`/treino/${topicSlug}`}
          className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white shadow hover:bg-slate-600"
        >
          Modo livre
        </Link>
        <Link
          href="/progresso"
          className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white shadow hover:bg-slate-600"
        >
          Ver progresso geral
        </Link>
        <Link
          href="/"
          className="ml-auto rounded-md px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Outros tópicos
        </Link>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  mono,
  accent = "muted",
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "muted" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    muted: "text-slate-200",
    good: "text-emerald-300",
    warn: "text-amber-300",
    bad: "text-rose-300",
  }[accent];
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-3xl font-bold", mono && "font-mono", toneClass)}>
        {value}
      </div>
    </div>
  );
}
