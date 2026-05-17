import { RANKS, SUITS, type Card, type HandCode, type Rank } from "@/domain/cards";

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
