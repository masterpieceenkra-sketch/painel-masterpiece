"use client";

import { useEffect, useMemo, useState } from "react";
import type { Action } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import { summarize } from "@/domain/progress";
import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import {
  defaultRaiseSize,
  evaluate,
  legalActions,
  newQuestion,
  type DrillQuestion,
} from "@/engine/drill";
import { handCodeOf } from "@/engine/handCode";
import type { ScoreResult } from "@/engine/scoring";
import { loadProgress, saveAttempt } from "@/storage/localProgress";
import { ActionButtons } from "@/components/ActionButtons";
import { ActionHistoryLine } from "@/components/ActionHistoryLine";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { HoleCards } from "@/components/HoleCards";
import { ProgressBadge } from "@/components/ProgressBadge";
import { SizingSlider } from "@/components/SizingSlider";
import { formatBB, formatPct } from "@/lib/format";

type Props = {
  topicId: string;
  spot: PreflopSpot;
  range: PreflopRange;
  targetAttempts: number;
};

type State =
  | { phase: "asking"; question: DrillQuestion }
  | { phase: "feedback"; question: DrillQuestion; result: ScoreResult; hand: string };

export function DrillRunner({ topicId, spot, range, targetAttempts }: Props) {
  const [state, setState] = useState<State | null>(null);
  const [stats, setStats] = useState({ total: 0, correctPct: 0, avgEvLossBB: 0 });

  const baseActions = useMemo(() => legalActions(spot), [spot]);
  const baseRaiseSize = defaultRaiseSize(spot);
  const [raiseSize, setRaiseSize] = useState<number>(baseRaiseSize ?? 0);

  const actions: Action[] = useMemo(
    () =>
      baseActions.map((a) =>
        a.kind === "raise" ? { kind: "raise", sizeBB: raiseSize } : a,
      ),
    [baseActions, raiseSize],
  );

  useEffect(() => {
    setState({ phase: "asking", question: newQuestion(spot, range) });
    const p = loadProgress(topicId);
    const s = summarize(p);
    setStats({ total: s.total, correctPct: s.correctPct, avgEvLossBB: s.avgEvLossBB });
    if (baseRaiseSize != null) setRaiseSize(baseRaiseSize);
  }, [topicId, spot, range, baseRaiseSize]);

  function handleChoose(action: Action) {
    if (!state || state.phase !== "asking") return;
    const result = evaluate(state.question, action);
    const hand = handCodeOf(state.question.heroCards[0], state.question.heroCards[1]);
    const updated = saveAttempt(topicId, {
      spotId: spot.id,
      hand,
      chosen: action,
      correct: result.correct,
      evLossBB: result.evLossBB,
      bucket: result.bucket,
      timestampMs: Date.now(),
    });
    const s = summarize(updated);
    setStats({ total: s.total, correctPct: s.correctPct, avgEvLossBB: s.avgEvLossBB });
    setState({ phase: "feedback", question: state.question, result, hand });
  }

  function handleNext() {
    setState({ phase: "asking", question: newQuestion(spot, range) });
    if (baseRaiseSize != null) setRaiseSize(baseRaiseSize);
  }

  if (!state) {
    return <div className="text-slate-400">Carregando…</div>;
  }

  const { question } = state;
  const hasRaise = baseActions.some((a) => a.kind === "raise");

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
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <div className="text-slate-300">
            <span className="font-semibold text-emerald-300">
              {POSITION_LABEL_PT[spot.heroPos]}
            </span>{" "}
            · Stack effective:{" "}
            <span className="font-semibold text-white">{spot.effectiveBB} BB</span>
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            chipEV (sem ICM)
          </div>
        </div>

        <ActionHistoryLine prior={spot.prior} heroPos={spot.heroPos} />

        <div className="mt-6 flex flex-col items-center gap-4">
          <HoleCards cards={question.heroCards} />
          <div className="text-xs text-slate-500">Sua mão</div>
        </div>
      </section>

      {state.phase === "asking" ? (
        <section className="space-y-4">
          {hasRaise && baseRaiseSize != null && (
            <SizingSlider
              minBB={Math.max(2, baseRaiseSize - 2)}
              maxBB={Math.min(spot.effectiveBB, baseRaiseSize + 4)}
              valueBB={raiseSize}
              onChange={setRaiseSize}
              label={spot.kind === "defense" ? "Tamanho 3-bet" : "Tamanho do raise"}
            />
          )}
          <div className="text-center text-sm text-slate-400">O que você faz?</div>
          <ActionButtons actions={actions} onChoose={handleChoose} />
        </section>
      ) : (
        <FeedbackPanel
          result={state.result}
          rangeId={range.id}
          rangeLabel={range.label}
          hand={state.hand}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
