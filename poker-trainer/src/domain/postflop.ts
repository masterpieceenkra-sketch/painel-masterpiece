import type { Action, Card, Position } from "./cards";

export type Street = "flop" | "turn" | "river";

export type PostflopActionEntry = {
  action: Action;
  frequency: number;
  evBB: number;
};

export type PostflopSolution = {
  actions: PostflopActionEntry[];
  bestAction: Action;
  explanation_ptBR: string;
  sourceNote: string;
};

export type PostflopSpot = {
  kind: "postflop";
  id: string;
  street: Street;
  board: Card[];
  preflop: { heroPos: Position; villainPos: Position; openSizeBB: number };
  heroHand: [Card, Card];
  heroStackBB: number;
  potBB: number;
  villainRangeLabel: string;
  legalActions: Action[];
  solution: PostflopSolution;
};
