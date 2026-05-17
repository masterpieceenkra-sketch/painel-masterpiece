import type { ActionKind, HandCode } from "./cards";

export type FrequencyMix = Partial<Record<ActionKind, number>>;

export type PreflopRange = {
  id: string;
  label: string;
  description: string;
  effectiveBB: number;
  sourceNote: string;
  defaultFrequencies: FrequencyMix;
  cells: Record<HandCode, FrequencyMix>;
};

export function normalizeMix(mix: FrequencyMix): FrequencyMix {
  const sum = Object.values(mix).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  if (sum === 0) return { fold: 1 };
  if (Math.abs(sum - 1) < 0.001) return mix;
  const out: FrequencyMix = {};
  for (const [k, v] of Object.entries(mix)) {
    if (v != null) out[k as ActionKind] = v / sum;
  }
  return out;
}

export function getMix(range: PreflopRange, hand: HandCode): FrequencyMix {
  return normalizeMix(range.cells[hand] ?? range.defaultFrequencies);
}

export function dominantAction(mix: FrequencyMix): ActionKind {
  let best: ActionKind = "fold";
  let bestFreq = -1;
  for (const [k, v] of Object.entries(mix)) {
    if ((v ?? 0) > bestFreq) {
      best = k as ActionKind;
      bestFreq = v ?? 0;
    }
  }
  return best;
}
