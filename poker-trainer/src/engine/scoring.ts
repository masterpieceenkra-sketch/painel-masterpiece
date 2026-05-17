import type { Action, ActionKind, HandCode } from "@/domain/cards";
import type { EvBucket } from "@/domain/progress";
import { dominantAction, getMix, type PreflopRange } from "@/domain/range";

export const MIX_TOLERANCE = 0.15;
export const RAISE_SIZING_TOLERANCE_BB = 0.5;

export type ScoreResult = {
  correct: boolean;
  evLossBB: number;
  bucket: EvBucket;
  bestAction: ActionKind;
  bestRaiseSizeBB?: number;
  mix: { kind: ActionKind; freq: number }[];
  reasoning: string;
};

function bucketOf(evLossBB: number): EvBucket {
  if (evLossBB <= 0.0001) return "perfect";
  if (evLossBB < 0.2) return "minor";
  if (evLossBB < 0.5) return "medium";
  return "major";
}

export function scorePreflop(
  range: PreflopRange,
  hand: HandCode,
  chosen: Action,
  defaultRaiseSizeBB?: number,
): ScoreResult {
  const mix = getMix(range, hand);
  const mixEntries = (Object.entries(mix) as [ActionKind, number][])
    .filter(([, freq]) => freq != null && freq > 0)
    .sort((a, b) => b[1] - a[1]);
  const best = dominantAction(mix);
  const chosenKind: ActionKind = chosen.kind;
  const chosenFreq = mix[chosenKind] ?? 0;

  let correct = chosenFreq >= MIX_TOLERANCE;
  if (correct && chosen.kind === "raise" && defaultRaiseSizeBB != null) {
    if (Math.abs(chosen.sizeBB - defaultRaiseSizeBB) > RAISE_SIZING_TOLERANCE_BB) {
      correct = false;
    }
  }

  const evLossBB = estimateEvLoss(mix, chosenKind, correct);
  const reasoning = explain(range, hand, mix, best, chosenKind, correct);

  return {
    correct,
    evLossBB,
    bucket: bucketOf(evLossBB),
    bestAction: best,
    bestRaiseSizeBB: best === "raise" ? defaultRaiseSizeBB : undefined,
    mix: mixEntries.map(([kind, freq]) => ({ kind, freq })),
    reasoning,
  };
}

function estimateEvLoss(
  mix: Record<string, number | undefined>,
  chosenKind: ActionKind,
  correct: boolean,
): number {
  if (correct) return 0;
  const bestFreq = Math.max(...Object.values(mix).map((v) => v ?? 0));
  const chosenFreq = mix[chosenKind] ?? 0;
  const gap = bestFreq - chosenFreq;
  if (gap > 0.8) return 1.0;
  if (gap > 0.5) return 0.6;
  return 0.3;
}

function explain(
  range: PreflopRange,
  hand: HandCode,
  mix: Record<string, number | undefined>,
  best: ActionKind,
  chosen: ActionKind,
  correct: boolean,
): string {
  const bestFreq = Math.round((mix[best] ?? 0) * 100);
  if (correct) {
    if (bestFreq >= 95) {
      return `Boa. Com ${hand}, esta range é ${best} puro (${bestFreq}%). ${range.label}.`;
    }
    return `Bem jogado. ${hand} faz parte da mix: melhor é ${best} (${bestFreq}%). Variar é correto aqui.`;
  }
  const chosenFreq = Math.round((mix[chosen] ?? 0) * 100);
  if (chosenFreq > 0) {
    return `${hand} faz ${chosen} só em ${chosenFreq}% das vezes — o GTO prefere ${best} (${bestFreq}%). ${range.label}.`;
  }
  return `${hand} não joga ${chosen} aqui. A range correta é ${best} (${bestFreq}%). ${range.label}.`;
}
