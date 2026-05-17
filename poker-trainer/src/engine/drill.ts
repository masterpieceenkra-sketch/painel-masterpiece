import type { Action, Card } from "@/domain/cards";
import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import { handCodeOf } from "./handCode";
import { dealRandomHand } from "./sampling";
import { scorePreflop, type ScoreResult } from "./scoring";

export type DrillQuestion = {
  spot: PreflopSpot;
  range: PreflopRange;
  heroCards: [Card, Card];
};

export function newQuestion(
  spot: PreflopSpot,
  range: PreflopRange,
  rand: () => number = Math.random,
): DrillQuestion {
  return { spot, range, heroCards: dealRandomHand(rand) };
}

export function evaluate(question: DrillQuestion, chosen: Action): ScoreResult {
  const hand = handCodeOf(question.heroCards[0], question.heroCards[1]);
  const defaultRaiseSizeBB = defaultRaiseSize(question.spot);
  return scorePreflop(question.range, hand, chosen, defaultRaiseSizeBB);
}

export function defaultRaiseSize(spot: PreflopSpot): number | undefined {
  if (spot.kind === "open") return spot.defaultOpenSizeBB;
  if (spot.kind === "defense") return spot.default3betSizeBB;
  return undefined;
}

export function legalActions(spot: PreflopSpot): Action[] {
  if (spot.kind === "pushfold") {
    if (spot.heroRole === "caller") {
      return [{ kind: "fold" }, { kind: "call" }];
    }
    return [{ kind: "fold" }, { kind: "jam" }];
  }
  if (spot.kind === "open") {
    return [
      { kind: "fold" },
      { kind: "raise", sizeBB: spot.defaultOpenSizeBB },
      { kind: "jam" },
    ];
  }
  return [
    { kind: "fold" },
    { kind: "call" },
    { kind: "raise", sizeBB: spot.default3betSizeBB },
  ];
}
