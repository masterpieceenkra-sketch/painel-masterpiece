export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];

export const SUITS = ["s", "h", "d", "c"] as const;
export type Suit = (typeof SUITS)[number];

export type Card = { rank: Rank; suit: Suit };

export type HandCode = string;

export const POSITIONS = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABEL_PT: Record<Position, string> = {
  UTG: "UTG",
  UTG1: "UTG+1",
  MP: "MP",
  LJ: "LJ",
  HJ: "HJ",
  CO: "CO",
  BTN: "Button",
  SB: "Small Blind",
  BB: "Big Blind",
};

export type ActionKind = "fold" | "call" | "raise" | "jam" | "check";

export type Action =
  | { kind: "fold" }
  | { kind: "call" }
  | { kind: "check" }
  | { kind: "raise"; sizeBB: number }
  | { kind: "jam" };

export const ACTION_LABEL_PT: Record<ActionKind, string> = {
  fold: "Fold",
  call: "Call",
  check: "Check",
  raise: "Raise",
  jam: "All-in",
};

export const RANK_INDEX: Record<Rank, number> = RANKS.reduce(
  (acc, r, i) => {
    acc[r] = i;
    return acc;
  },
  {} as Record<Rank, number>,
);
