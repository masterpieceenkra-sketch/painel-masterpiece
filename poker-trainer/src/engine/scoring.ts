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
  chosenRaiseSizeBB?: number;
  sizingMiss: boolean;
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

  const actionInMix = chosenFreq >= MIX_TOLERANCE;
  let sizingMiss = false;
  let sizingOvershootBB = 0;
  if (
    actionInMix &&
    chosen.kind === "raise" &&
    defaultRaiseSizeBB != null
  ) {
    sizingOvershootBB = Math.abs(chosen.sizeBB - defaultRaiseSizeBB);
    if (sizingOvershootBB > RAISE_SIZING_TOLERANCE_BB) {
      sizingMiss = true;
    }
  }

  // Acertou a ação mas errou só o sizing: não é "errou" pleno — penalidade
  // pequena proporcional ao overshoot, sem inflar o bucket pra "major".
  const correct = actionInMix && !sizingMiss;
  let evLossBB: number;
  if (sizingMiss) {
    evLossBB = Math.min(
      0.18,
      0.04 + (sizingOvershootBB - RAISE_SIZING_TOLERANCE_BB) * 0.08,
    );
  } else {
    evLossBB = estimateEvLoss(mix, chosenKind, correct);
  }
  const reasoning = explain({
    range,
    hand,
    mix,
    best,
    chosenKind,
    chosen,
    correct,
    sizingMiss,
    defaultRaiseSizeBB,
  });

  return {
    correct,
    evLossBB,
    bucket: bucketOf(evLossBB),
    bestAction: best,
    bestRaiseSizeBB: best === "raise" ? defaultRaiseSizeBB : undefined,
    chosenRaiseSizeBB: chosen.kind === "raise" ? chosen.sizeBB : undefined,
    sizingMiss,
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
  const freqs = Object.values(mix).map((v) => v ?? 0);
  if (freqs.length === 0) return 0.3;
  const bestFreq = Math.max(...freqs);
  const chosenFreq = mix[chosenKind] ?? 0;
  const gap = bestFreq - chosenFreq;
  if (gap > 0.8) return 1.0;
  if (gap > 0.5) return 0.6;
  return 0.3;
}

function explain(args: {
  range: PreflopRange;
  hand: HandCode;
  mix: Record<string, number | undefined>;
  best: ActionKind;
  chosenKind: ActionKind;
  chosen: Action;
  correct: boolean;
  sizingMiss: boolean;
  defaultRaiseSizeBB?: number;
}): string {
  const { range, hand, mix, best, chosenKind, chosen, correct, sizingMiss, defaultRaiseSizeBB } = args;
  const bestFreq = Math.round((mix[best] ?? 0) * 100);
  if (sizingMiss && chosen.kind === "raise" && defaultRaiseSizeBB != null) {
    return `${hand}: ação certa (raise), mas sizing ${chosen.sizeBB}BB está fora da banda ±${RAISE_SIZING_TOLERANCE_BB}BB do padrão ${defaultRaiseSizeBB}BB. ${range.label}.`;
  }
  if (correct) {
    if (chosen.kind === "raise" && defaultRaiseSizeBB != null && Math.abs(chosen.sizeBB - defaultRaiseSizeBB) > 0.05) {
      return `Boa. ${hand}: raise ${chosen.sizeBB}BB dentro da tolerância (padrão ${defaultRaiseSizeBB}BB). ${range.label}.`;
    }
    if (bestFreq >= 95) {
      return `Boa. Com ${hand}, esta range é ${best} puro (${bestFreq}%). ${range.label}.`;
    }
    return `Bem jogado. ${hand} faz parte da mix: melhor é ${best} (${bestFreq}%). Variar é correto aqui.`;
  }
  const chosenFreq = Math.round((mix[chosenKind] ?? 0) * 100);
  if (chosenFreq > 0) {
    return `${hand} faz ${chosenKind} só em ${chosenFreq}% das vezes — o GTO prefere ${best} (${bestFreq}%). ${range.label}.`;
  }
  return `${hand} não joga ${chosenKind} aqui. A range correta é ${best} (${bestFreq}%). ${range.label}.`;
}
