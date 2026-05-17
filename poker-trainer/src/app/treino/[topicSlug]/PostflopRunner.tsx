"use client";

import { useEffect, useMemo, useState } from "react";
import type { Action } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import type { PostflopSpot } from "@/domain/postflop";
import { summarize } from "@/domain/progress";
import { handCodeOf } from "@/engine/handCode";
import {
  labelForAction,
  samplePostflop,
  scorePostflop,
  type PostflopScoreResult,
} from "@/engine/postflop";
import { eventKey } from "@/lib/keyboardShortcuts";
import { loadProgress, saveAttempt } from "@/storage/localProgress";
import { Board } from "@/components/Board";
import { HoleCards } from "@/components/HoleCards";
import { ProgressBadge } from "@/components/ProgressBadge";
import { PostflopFeedback } from "@/components/PostflopFeedback";
import { cn } from "@/lib/cn";
import { formatBB, formatPct } from "@/lib/format";

type Props = {
  topicId: string;
  spots: PostflopSpot[];
  targetAttempts: number;
};

type State =
  | { phase: "asking"; spot: PostflopSpot }
  | { phase: "feedback"; spot: PostflopSpot; result: PostflopScoreResult; chosen: Action };

const KIND_VARIANT: Record<string, string> = {
  check: "bg-sky-700 hover:bg-sky-600",
  raise: "bg-amber-600 hover:bg-amber-500",
  jam: "bg-rose-700 hover:bg-rose-600",
  fold: "bg-slate-700 hover:bg-slate-600",
  call: "bg-sky-700 hover:bg-sky-600",
};

export function PostflopRunner({ topicId, spots, targetAttempts }: Props) {
  const [state, setState] = useState<State | null>(null);
  const [stats, setStats] = useState({ total: 0, correctPct: 0, avgEvLossBB: 0 });

  useEffect(() => {
    setState({ phase: "asking", spot: samplePostflop(spots) });
    const p = loadProgress(topicId);
    const s = summarize(p);
    setStats({ total: s.total, correctPct: s.correctPct, avgEvLossBB: s.avgEvLossBB });
  }, [topicId, spots]);

  const heroHandCode = useMemo(() => {
    if (!state) return "";
    return handCodeOf(state.spot.heroHand[0], state.spot.heroHand[1]);
  }, [state]);

  function handleChoose(action: Action) {
    if (!state || state.phase !== "asking") return;
    const result = scorePostflop(state.spot, action);
    const updated = saveAttempt(topicId, {
      spotId: state.spot.id,
      hand: heroHandCode,
      chosen: action,
      correct: result.correct,
      evLossBB: result.evLossBB,
      bucket: result.bucket,
      timestampMs: Date.now(),
    });
    const s = summarize(updated);
    setStats({ total: s.total, correctPct: s.correctPct, avgEvLossBB: s.avgEvLossBB });
    setState({ phase: "feedback", spot: state.spot, result, chosen: action });
  }

  function handleNext() {
    setState({ phase: "asking", spot: samplePostflop(spots) });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = eventKey(e);
      if (!key || !state) return;
      if (state.phase === "feedback") {
        if (key === "SPACE" || key === "ENTER") {
          e.preventDefault();
          handleNext();
        }
        return;
      }
      const legal = state.spot.legalActions;
      const match = legal.find((a) => {
        if (key === "F") return a.kind === "fold";
        if (key === "C") return a.kind === "call" || a.kind === "check";
        if (key === "R") return a.kind === "raise";
        if (key === "J") return a.kind === "jam";
        return false;
      });
      if (match) {
        e.preventDefault();
        handleChoose(match);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state) return <div className="text-slate-400">Carregando…</div>;

  const { spot } = state;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProgressBadge
          attempts={stats.total}
          target={targetAttempts}
          correctPct={stats.correctPct}
        />
        <div className="text-xs text-slate-500">
          EV médio perdido:{" "}
          <span className="font-mono text-slate-300">{formatBB(stats.avgEvLossBB)}</span>{" "}
          · Acerto:{" "}
          <span className="font-mono text-slate-300">{formatPct(stats.correctPct)}</span>
        </div>
      </div>

      <section className="rounded-lg border border-slate-800 bg-emerald-950/40 p-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 text-sm">
          <div className="text-slate-300">
            <span className="font-semibold text-emerald-300">
              {POSITION_LABEL_PT[spot.preflop.heroPos]}
            </span>{" "}
            vs{" "}
            <span className="font-semibold text-slate-200">
              {POSITION_LABEL_PT[spot.preflop.villainPos]}
            </span>{" "}
            · Pot:{" "}
            <span className="font-semibold text-white">{spot.potBB} BB</span> · Stack:{" "}
            <span className="font-semibold text-white">{spot.heroStackBB} BB</span>
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {spot.street === "flop" ? "FLOP" : spot.street === "turn" ? "TURN" : "RIVER"} · chipEV
          </div>
        </div>

        <p className="text-sm text-slate-400">
          Pré-flop: {POSITION_LABEL_PT[spot.preflop.heroPos]} abre {spot.preflop.openSizeBB}BB,{" "}
          {POSITION_LABEL_PT[spot.preflop.villainPos]} paga. {POSITION_LABEL_PT[spot.preflop.villainPos]}{" "}
          mesa no flop.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Range de villain: {spot.villainRangeLabel}
        </p>

        <div className="mt-5 flex flex-col items-center gap-4">
          <div>
            <div className="mb-1 text-center text-xs uppercase tracking-wide text-slate-500">
              Board
            </div>
            <Board cards={spot.board} />
          </div>
          <div>
            <div className="mb-1 text-center text-xs uppercase tracking-wide text-slate-500">
              Sua mão
            </div>
            <HoleCards cards={spot.heroHand} />
          </div>
        </div>
      </section>

      {state.phase === "asking" ? (
        <section className="space-y-2">
          <div className="text-center text-sm text-slate-400">O que você faz?</div>
          <div className="flex flex-wrap justify-center gap-3">
            {spot.legalActions.map((a, i) => {
              const hint =
                a.kind === "check" || a.kind === "call"
                  ? "C"
                  : a.kind === "raise"
                    ? "R"
                    : a.kind === "jam"
                      ? "J"
                      : a.kind === "fold"
                        ? "F"
                        : null;
              return (
                <button
                  type="button"
                  key={`${a.kind}-${i}`}
                  onClick={() => handleChoose(a)}
                  className={cn(
                    "min-w-[120px] rounded-md px-5 py-3 font-semibold text-white shadow transition-colors",
                    KIND_VARIANT[a.kind] ?? "bg-slate-700",
                  )}
                >
                  <span>{labelForAction(a, spot.potBB)}</span>
                  {hint && (
                    <span className="ml-2 rounded bg-black/30 px-1.5 py-0.5 text-xs font-mono">
                      {hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-500">
            Atalhos: <kbd className="font-mono">C</kbd> ·{" "}
            <kbd className="font-mono">R</kbd> · <kbd className="font-mono">J</kbd> ·{" "}
            <kbd className="font-mono">Espaço</kbd> próxima
          </p>
        </section>
      ) : (
        <PostflopFeedback
          result={state.result}
          chosen={state.chosen}
          potBB={spot.potBB}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
