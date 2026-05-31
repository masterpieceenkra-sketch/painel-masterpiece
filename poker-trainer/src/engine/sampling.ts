import { RANKS, SUITS, type Card, type HandCode, type Rank } from "@/domain/cards";
import type { Attempt } from "@/domain/progress";

export function pickRandom<T>(arr: readonly T[], rand: () => number = Math.random): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function dealRandomHand(rand: () => number = Math.random): [Card, Card] {
  while (true) {
    const a: Card = { rank: pickRandom(RANKS, rand), suit: pickRandom(SUITS, rand) };
    const b: Card = { rank: pickRandom(RANKS, rand), suit: pickRandom(SUITS, rand) };
    if (a.rank !== b.rank || a.suit !== b.suit) return [a, b];
  }
}

export function dealHandFromCode(code: HandCode, rand: () => number = Math.random): [Card, Card] {
  const hi = code[0] as Rank;
  const lo = code[1] as Rank;
  if (hi === lo) {
    const suits = [...SUITS].sort(() => rand() - 0.5);
    return [
      { rank: hi, suit: suits[0] },
      { rank: lo, suit: suits[1] },
    ];
  }
  const suited = code[2] === "s";
  if (suited) {
    const suit = pickRandom(SUITS, rand);
    return [
      { rank: hi, suit },
      { rank: lo, suit },
    ];
  }
  const suits = [...SUITS].sort(() => rand() - 0.5);
  return [
    { rank: hi, suit: suits[0] },
    { rank: lo, suit: suits[1] },
  ];
}

// ============================================================
// Spaced repetition — prioritize hands/spots the user got wrong
// recently so they show up more often than random sampling.
//
// Strategy: with probability SR_PROB, pick from the pool of
// last-N wrong attempts. Otherwise fall back to uniform random.
// Keeps the drill fresh while drilling weaknesses.
// ============================================================

const SR_PROB = 0.4;
const SR_LOOKBACK = 20;

function recentWrongAttempts(attempts: Attempt[]): Attempt[] {
  return attempts
    .slice()
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .filter((a) => !a.correct)
    .slice(0, SR_LOOKBACK);
}

export function dealHandWithSR(
  attempts: Attempt[],
  rand: () => number = Math.random,
): [Card, Card] {
  const wrong = recentWrongAttempts(attempts);
  if (wrong.length > 0 && rand() < SR_PROB) {
    const target = wrong[Math.floor(rand() * wrong.length)];
    return dealHandFromCode(target.hand as HandCode, rand);
  }
  return dealRandomHand(rand);
}

export function pickSpotWithSR<T extends { id: string }>(
  spots: T[],
  attempts: Attempt[],
  rand: () => number = Math.random,
): T {
  if (spots.length === 0) {
    throw new Error("pickSpotWithSR: empty spots array");
  }
  const wrong = recentWrongAttempts(attempts);
  if (wrong.length > 0 && rand() < SR_PROB) {
    const wrongIds = wrong.map((a) => a.spotId);
    const candidates = spots.filter((s) => wrongIds.includes(s.id));
    if (candidates.length > 0) {
      return candidates[Math.floor(rand() * candidates.length)];
    }
  }
  return spots[Math.floor(rand() * spots.length)];
}

