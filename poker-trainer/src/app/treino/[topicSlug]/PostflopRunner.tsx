"use client";

import { useEffect, useMemo, useState } from "react";
import type { Action } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import type { PostflopSpot, Street } from "@/domain/postflop";
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
import { Card } from "@/components/Card";
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

const STREETS: Street[] = ["flop", "turn", "river"];
const STREET_LABEL: Record<Street, string> = {
  flop: "FLOP",
  turn: "TURN",
  river: "RIVER",
};

// Felt surface: emerald radial gradient + subtle dot-grid texture overlay.
// Defined inline so this unit stays self-contained (does not depend on
// shared globals.css additions from sibling units).
const FELT_STYLE: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(circle, rgba(16,185,129,0.06) 1px, transparent 1px)",
    "radial-gradient(ellipse at center, #064e3b 0%, #022c22 100%)",
  ].join(", "),
  backgroundSize: "14px 14px, 100% 100%",
  backgroundPosition: "0 0, center",
};

function DealerButton() {
  return (
    <span
      aria-label="Botão do dealer"
      title="Dealer"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold leading-none text-slate-900 shadow ring-1 ring-amber-500/60"
    >
      D
    </span>
  );
}

function StreetBreadcrumb({ current }: { current: Street }) {
  return (
    <nav
      aria-label="Street atual"
      className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/60 p-1"
    >
      {STREETS.map((s) => {
        const active = s === current;
        return (
          <span
            key={s}
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex min-h-[32px] min-w-[56px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "motion-reduce:transition-none",
              active ? "bg-emerald-600 text-white shadow" : "text-slate-400",
            )}
          >
            {STREET_LABEL[s]}
          </span>
        );
      })}
    </nav>
  );
}

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
      const raises = legal.filter((a) => a.kind === "raise");
      let match: typeof legal[number] | undefined;
      if (key === "F") match = legal.find((a) => a.kind === "fold");
      else if (key === "C") match = legal.find((a) => a.kind === "call" || a.kind === "check");
      else if (key === "R") match = raises[0];
      else if (key === "B") match = raises[1] ?? raises[0];
      else if (key === "J") match = legal.find((a) => a.kind === "jam");
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
  const heroPosLabel = POSITION_LABEL_PT[spot.preflop.heroPos];
  const villainPosLabel = POSITION_LABEL_PT[spot.preflop.villainPos];
  const heroIsButton = spot.preflop.heroPos === "BTN";

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

      <section
        aria-label="Mesa de poker"
        className="overflow-hidden rounded-2xl border border-emerald-900/60 shadow-xl"
        style={FELT_STYLE}
      >
        <div className="flex flex-col items-stretch gap-6 px-4 py-6 sm:px-8 sm:py-8">
          {/* Villain seat (top) */}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-amber-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200 ring-1 ring-amber-700/40">
                {villainPosLabel}
              </span>
              <span
                className="max-w-[18rem] truncate rounded-full bg-amber-900/30 px-3 py-1 text-xs text-amber-100/90 ring-1 ring-amber-700/30"
                title={spot.villainRangeLabel}
              >
                {spot.villainRangeLabel}
              </span>
            </div>
            <div className="flex gap-2" aria-label="Cartas do vilão (viradas)">
              <Card card="back" size="sm" />
              <Card card="back" size="sm" />
            </div>
          </div>

          {/* Felt center: pot + board */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-slate-950/60 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-700/40">
              Pot: <span className="font-mono text-white">{spot.potBB} BB</span>
            </div>
            <div className="flex justify-center">
              <Board cards={spot.board} />
            </div>
          </div>

          {/* Hero seat (bottom) */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100 ring-1 ring-emerald-500/40">
                {heroIsButton && <DealerButton />}
                <span>
                  {heroPosLabel} ·{" "}
                  <span className="font-mono text-white">{spot.heroStackBB} BB</span>
                </span>
              </span>
              <StreetBreadcrumb current={spot.street} />
            </div>
            <div className="flex justify-center">
              <HoleCards cards={spot.heroHand} />
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Pré-flop: {heroPosLabel} abre {spot.preflop.openSizeBB}BB, {villainPosLabel} paga.{" "}
        {villainPosLabel} mesa no {spot.street}. · chipEV
      </p>

      {state.phase === "asking" ? (
        (() => {
          let raiseIdx = 0;
          const raiseCount = spot.legalActions.filter((a) => a.kind === "raise").length;
          return (
            <section className="space-y-2">
              <div className="text-center text-sm text-slate-400">O que você faz?</div>
              <div className="flex flex-wrap justify-center gap-3">
                {spot.legalActions.map((a, i) => {
                  let hint: string | null = null;
                  if (a.kind === "check" || a.kind === "call") hint = "C";
                  else if (a.kind === "raise") {
                    hint = raiseIdx === 0 ? "R" : raiseIdx === 1 ? "B" : null;
                    raiseIdx++;
                  } else if (a.kind === "jam") hint = "J";
                  else if (a.kind === "fold") hint = "F";
                  return (
                    <button
                      type="button"
                      key={`${a.kind}-${i}`}
                      onClick={() => handleChoose(a)}
                      className={cn(
                        "min-h-[44px] min-w-[120px] rounded-md px-5 py-3 font-semibold text-white shadow transition-colors",
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
                <kbd className="font-mono">R</kbd>
                {raiseCount > 1 && (
                  <>
                    {" "}
                    · <kbd className="font-mono">B</kbd> (bet maior)
                  </>
                )}{" "}
                · <kbd className="font-mono">J</kbd> ·{" "}
                <kbd className="font-mono">Espaço</kbd> próxima
              </p>
            </section>
          );
        })()
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
