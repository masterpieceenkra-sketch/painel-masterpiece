import type { Action, Card, Rank, Suit } from "@/domain/cards";
import type { EvBucket } from "@/domain/progress";
import type { PostflopActionEntry, PostflopSpot } from "@/domain/postflop";

export type PostflopScoreResult = {
  correct: boolean;
  evLossBB: number;
  bucket: EvBucket;
  bestAction: Action;
  chosenEvBB: number;
  bestEvBB: number;
  mix: { action: Action; label: string; freq: number; evBB: number }[];
  explanation_ptBR: string;
  sourceNote: string;
};

export const MIX_TOLERANCE = 0.15;
const SIZE_TOLERANCE_PCT = 0.08;

function bucketOf(evLossBB: number): EvBucket {
  if (evLossBB <= 0.0001) return "perfect";
  if (evLossBB < 0.2) return "minor";
  if (evLossBB < 0.5) return "medium";
  return "major";
}

export function parseCard(s: string): Card {
  return { rank: s[0] as Rank, suit: s[1] as Suit };
}

export function labelForBet(sizeBB: number, potBB: number): string {
  if (sizeBB <= 0) return "Check";
  const pct = (sizeBB / potBB) * 100;
  const round = (n: number) => Math.abs(pct - n) < pct * SIZE_TOLERANCE_PCT + 3;
  if (round(25)) return "Bet 25%";
  if (round(33)) return "Bet 33%";
  if (round(50)) return "Bet 50%";
  if (round(75)) return "Bet 75%";
  if (round(100)) return "Bet pot";
  return `Bet ${pct.toFixed(0)}%`;
}

export function labelForAction(action: Action, potBB: number): string {
  switch (action.kind) {
    case "fold":
      return "Fold";
    case "check":
      return "Check";
    case "call":
      return "Call";
    case "jam":
      return "All-in";
    case "raise":
      return labelForBet(action.sizeBB, potBB);
  }
}

function entryMatches(entry: PostflopActionEntry, chosen: Action, potBB: number): boolean {
  if (entry.action.kind !== chosen.kind) return false;
  if (entry.action.kind === "raise" && chosen.kind === "raise") {
    const a = entry.action.sizeBB / potBB;
    const b = chosen.sizeBB / potBB;
    return Math.abs(a - b) <= SIZE_TOLERANCE_PCT + 0.05;
  }
  return true;
}

export function scorePostflop(spot: PostflopSpot, chosen: Action): PostflopScoreResult {
  const actions = spot.solution.actions;
  const bestEntry = actions.reduce<PostflopActionEntry>(
    (a, b) => (b.evBB > a.evBB ? b : a),
    actions[0],
  );
  const chosenEntry = actions.find((a) => entryMatches(a, chosen, spot.potBB));
  const chosenEv = chosenEntry?.evBB ?? bestEntry.evBB - 1.0;
  const evLossBB = Math.max(0, bestEntry.evBB - chosenEv);
  const correct =
    chosenEntry != null && chosenEntry.frequency >= MIX_TOLERANCE;

  return {
    correct,
    evLossBB,
    bucket: bucketOf(evLossBB),
    bestAction: bestEntry.action,
    chosenEvBB: chosenEv,
    bestEvBB: bestEntry.evBB,
    mix: actions.map((a) => ({
      action: a.action,
      label: labelForAction(a.action, spot.potBB),
      freq: a.frequency,
      evBB: a.evBB,
    })),
    explanation_ptBR: spot.solution.explanation_ptBR,
    sourceNote: spot.solution.sourceNote,
  };
}

export function samplePostflop(
  spots: PostflopSpot[],
  rand: () => number = Math.random,
): PostflopSpot {
  return spots[Math.floor(rand() * spots.length)];
}
