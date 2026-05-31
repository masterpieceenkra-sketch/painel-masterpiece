import type { Action, ActionKind, Card, Position, Rank, Suit } from "@/domain/cards";
import type { PostflopSpot, Street } from "@/domain/postflop";
import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import { handCodeOf } from "./handCode";
import { scorePreflop } from "./scoring";

export type GameFormat = "cash" | "mtt";

export type StreetAction = {
  actor: "hero" | "villain";
  action: Action;
};

export type HandInput = {
  format: GameFormat;
  effectiveBB: number;
  heroPos: Position;
  villainPos: Position;
  heroCards: [Card, Card];
  preflopActions: StreetAction[];
  flop?: {
    cards: [Card, Card, Card];
    actions: StreetAction[];
  };
  turn?: {
    card: Card;
    actions: StreetAction[];
  };
  river?: {
    card: Card;
    actions: StreetAction[];
  };
};

export type Verdict = "match" | "deviation" | "heuristic";

export type AnalyzedStep = {
  street: "preflop" | Street;
  actor: "hero" | "villain";
  action: Action;
  evLossBB: number | null;
  verdict: Verdict;
  tone: "good" | "warn" | "bad" | "muted";
  headline: string;
  reasoning: string;
  bestAction?: Action;
};

export type HandAnalysis = {
  steps: AnalyzedStep[];
  summary: {
    totalEvLoss: number;
    worstStepIdx: number | null;
    suggestedTopicSlug: string | null;
  };
};

/* ─────────── public ─────────── */

export function analyzeHand(
  input: HandInput,
  context: {
    spots: PreflopSpot[];
    ranges: PreflopRange[];
    postflopSpots: PostflopSpot[];
    topicsByRange: Map<string, string>; // rangeId → topic slug
  },
): HandAnalysis {
  const steps: AnalyzedStep[] = [];

  // ── Preflop hero actions ──
  const preflopHeroActions = input.preflopActions
    .map((a, idx) => ({ a, idx }))
    .filter((x) => x.a.actor === "hero");

  for (const { a } of preflopHeroActions) {
    steps.push(analyzePreflopAction(input, a.action, context));
  }
  // Villain preflop actions get a narrative-only step (no scoring against villain).
  for (const va of input.preflopActions.filter((x) => x.actor === "villain")) {
    steps.push(narrateVillainStep("preflop", va.action));
  }

  // Re-sort preflop steps in original order
  steps.sort((s1, s2) => {
    if (s1.street !== "preflop" || s2.street !== "preflop") return 0;
    return 0;
  });

  // ── Postflop streets ──
  if (input.flop) {
    for (const fa of input.flop.actions) {
      steps.push(
        fa.actor === "hero"
          ? analyzePostflopAction(input, "flop", fa.action, context)
          : narrateVillainStep("flop", fa.action),
      );
    }
  }
  if (input.turn) {
    for (const ta of input.turn.actions) {
      steps.push(
        ta.actor === "hero"
          ? analyzePostflopAction(input, "turn", ta.action, context)
          : narrateVillainStep("turn", ta.action),
      );
    }
  }
  if (input.river) {
    for (const ra of input.river.actions) {
      steps.push(
        ra.actor === "hero"
          ? analyzePostflopAction(input, "river", ra.action, context)
          : narrateVillainStep("river", ra.action),
      );
    }
  }

  const heroSteps = steps.filter((s) => s.actor === "hero");
  const totalEvLoss = heroSteps.reduce((s, x) => s + (x.evLossBB ?? 0), 0);
  let worstIdx: number | null = null;
  let worstLoss = 0;
  steps.forEach((s, i) => {
    if (s.actor === "hero" && (s.evLossBB ?? 0) > worstLoss) {
      worstLoss = s.evLossBB ?? 0;
      worstIdx = i;
    }
  });

  // Suggested topic: from the worst step, use its bestAction street to point to
  // a related drill via range mapping (preflop) or postflop topic.
  let suggestedTopicSlug: string | null = null;
  if (worstIdx != null) {
    const worst = steps[worstIdx];
    if (worst.street === "preflop") {
      const match = findBestPreflopMatch(input, context.spots);
      if (match) suggestedTopicSlug = context.topicsByRange.get(match.solutionRangeId) ?? null;
    } else {
      // Postflop: just suggest the first postflop topic that shares heroPos role.
      const heroIsAggressor = input.heroPos === "BTN" || input.heroPos === "CO";
      suggestedTopicSlug = heroIsAggressor
        ? "postflop-srp-btn-vs-bb-axx"
        : "postflop-srp-bb-vs-btn-cbet";
    }
  }

  return {
    steps,
    summary: { totalEvLoss, worstStepIdx: worstIdx, suggestedTopicSlug },
  };
}

/* ─────────── preflop analysis ─────────── */

function analyzePreflopAction(
  input: HandInput,
  action: Action,
  context: { spots: PreflopSpot[]; ranges: PreflopRange[] },
): AnalyzedStep {
  const match = findBestPreflopMatch(input, context.spots);
  const handCode = handCodeOf(input.heroCards[0], input.heroCards[1]);

  if (match) {
    const range = context.ranges.find((r) => r.id === match.solutionRangeId);
    if (range) {
      const defaultRaise =
        match.kind === "open"
          ? match.defaultOpenSizeBB
          : match.kind === "defense"
            ? match.default3betSizeBB
            : undefined;
      const result = scorePreflop(range, handCode, action, defaultRaise);
      const tone = result.correct
        ? "good"
        : result.evLossBB < 0.3
          ? "warn"
          : "bad";
      const verdict: Verdict = result.correct ? "match" : "deviation";
      return {
        street: "preflop",
        actor: "hero",
        action,
        evLossBB: result.evLossBB,
        verdict,
        tone,
        headline: result.correct
          ? `${handCode} — ${labelAction(action)} é parte da range correta`
          : `${handCode} — ${labelAction(action)} é deviation (melhor: ${labelActionKind(result.bestAction)})`,
        reasoning: `${result.reasoning} (Spot exato encontrado: ${match.id}.)`,
        bestAction: result.bestAction === "raise"
          ? { kind: "raise", sizeBB: defaultRaise ?? 0 }
          : result.bestAction === "fold"
            ? { kind: "fold" }
            : result.bestAction === "call"
              ? { kind: "call" }
              : result.bestAction === "check"
                ? { kind: "check" }
                : { kind: "jam" },
      };
    }
  }

  // Heuristic fallback
  return preflopHeuristic(input, action, handCode);
}

function findBestPreflopMatch(
  input: HandInput,
  spots: PreflopSpot[],
): PreflopSpot | null {
  // Match by heroPos + closest effectiveBB + (for defense) villainPos + (for pushfold) heroRole consistency.
  const heroPriorAction = lastVillainPreflopAction(input);
  let bestMatch: PreflopSpot | null = null;
  let bestScore = -1;
  for (const s of spots) {
    if (s.heroPos !== input.heroPos) continue;
    let score = 50;
    // Stack proximity
    const stackDelta = Math.abs(s.effectiveBB - input.effectiveBB);
    score -= stackDelta * 2;

    // Spot kind matching with input shape
    if (heroPriorAction == null && s.kind !== "defense") {
      score += 20; // hero opens with no prior aggression
    } else if (heroPriorAction != null) {
      // Hero faces aggression — defense or pushfold(caller)
      if (s.kind === "defense") score += 25;
      if (s.kind === "pushfold" && s.heroRole === "caller") score += 25;
    }

    // Villain position match for defense
    if (s.kind === "defense" && s.villainPos === input.villainPos) score += 15;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = s;
    }
  }
  // Require minimum quality to avoid forced bad matches
  return bestScore >= 40 ? bestMatch : null;
}

function lastVillainPreflopAction(input: HandInput): Action | null {
  for (let i = input.preflopActions.length - 1; i >= 0; i--) {
    const a = input.preflopActions[i];
    if (a.actor === "villain" && a.action.kind !== "fold") return a.action;
  }
  return null;
}

function preflopHeuristic(
  input: HandInput,
  action: Action,
  handCode: string,
): AnalyzedStep {
  // Simple push/fold heuristic by Sklansky chubukov ish premium tier
  const isPremium = /^(AA|KK|QQ|JJ|TT|AKs|AKo|AQs|AQo|AJs|KQs)$/.test(handCode);
  const isStrong = /^(99|88|77|AT|KJs|KQ|QJs|JTs)/.test(handCode);
  const isWeak = /^([2-7][2-5]o)$/.test(handCode);

  const shortStack = input.effectiveBB <= 12;

  let bestKind: ActionKind = "fold";
  if (shortStack) {
    if (isPremium || (isStrong && input.heroPos !== "UTG")) bestKind = "jam";
  } else {
    if (isPremium) bestKind = "raise";
    else if (isStrong && (input.heroPos === "CO" || input.heroPos === "BTN")) bestKind = "raise";
  }

  const correct = action.kind === bestKind || (bestKind === "raise" && action.kind === "call");
  const evLossBB = correct ? 0 : isWeak ? 0.8 : 0.3;
  const tone = correct ? "good" : evLossBB < 0.3 ? "warn" : "bad";

  return {
    street: "preflop",
    actor: "hero",
    action,
    evLossBB,
    verdict: "heuristic",
    tone,
    headline: correct
      ? `${handCode} — ${labelAction(action)} parece razoável`
      : `${handCode} — provavelmente deviation (sem spot exato; heurística sugere ${labelActionKind(bestKind)})`,
    reasoning:
      `Não temos um spot pré-resolvido casando exatamente (${input.heroPos} ${input.effectiveBB}BB vs ${input.villainPos}). ` +
      `Análise por heurística simples: mãos premium jogam ${shortStack ? "jam" : "raise"}, ` +
      `marginais por posição, weak offsuit folda. Para análise precisa, jogue tópicos do treino similares.`,
  };
}

/* ─────────── postflop analysis ─────────── */

function analyzePostflopAction(
  input: HandInput,
  street: Street,
  action: Action,
  context: { postflopSpots: PostflopSpot[] },
): AnalyzedStep {
  const board = boardForStreet(input, street);
  if (!board) {
    return {
      street,
      actor: "hero",
      action,
      evLossBB: null,
      verdict: "heuristic",
      tone: "muted",
      headline: `${labelAction(action)} no ${streetLabel(street)}`,
      reasoning: "Sem board informado para este street — análise não disponível.",
    };
  }

  // Try to find a similar postflop spot by texture + heroPos role.
  const texture = boardTexture(board);
  const heroIsAggressor = isHeroAggressor(input);
  const similar = context.postflopSpots
    .filter((s) => s.street === street)
    .map((s) => ({
      spot: s,
      score: similarityScore(s, board, input, heroIsAggressor),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (similar && similar.score >= 60) {
    // We have a strong texture match — apply that spot's recommendation heuristically.
    const best = similar.spot.solution.bestAction;
    const matchedAction = matchActionKind(best, action);
    const evLossBB = matchedAction ? 0 : estimatePostflopEvLoss(best, action, similar.spot.potBB);
    const tone: AnalyzedStep["tone"] = matchedAction ? "good" : evLossBB < 0.3 ? "warn" : "bad";
    return {
      street,
      actor: "hero",
      action,
      evLossBB,
      verdict: "deviation",
      tone,
      headline: matchedAction
        ? `${labelAction(action)} no ${streetLabel(street)} — alinha com spot similar`
        : `${labelAction(action)} no ${streetLabel(street)} — solver prefere ${labelAction(best)}`,
      reasoning:
        `Board ${board.map(cardCode).join(" ")} (${texture}). ` +
        `Spot similar encontrado: ${similar.spot.id}. ` +
        `Recomendação dele: ${labelAction(best)}. ${similar.spot.solution.explanation_ptBR}`,
      bestAction: best,
    };
  }

  // Heuristic fallback
  return postflopHeuristic(input, street, action, board);
}

function boardForStreet(input: HandInput, street: Street): Card[] | null {
  if (street === "flop" && input.flop) return input.flop.cards;
  if (street === "turn" && input.flop && input.turn)
    return [...input.flop.cards, input.turn.card];
  if (street === "river" && input.flop && input.turn && input.river)
    return [...input.flop.cards, input.turn.card, input.river.card];
  return null;
}

function boardTexture(board: Card[]): string {
  const ranks = board.map((c) => c.rank);
  const suits = board.map((c) => c.suit);
  const uniqueSuits = new Set(suits).size;
  const paired = ranks.some((r, i) => ranks.indexOf(r) !== i);
  const hasA = ranks.includes("A");
  const hasK = ranks.includes("K");
  const tags: string[] = [];
  if (hasA) tags.push("A-high");
  else if (hasK) tags.push("K-high");
  if (paired) tags.push("paired");
  if (uniqueSuits === 1) tags.push("monotone");
  else if (uniqueSuits === 2) tags.push("flush-draw");
  else tags.push("rainbow");
  return tags.join(" · ");
}

function similarityScore(
  spot: PostflopSpot,
  board: Card[],
  input: HandInput,
  heroIsAggressor: boolean,
): number {
  let score = 0;
  // Hero position role
  if (heroIsAggressor && spot.preflop.heroPos === "BTN") score += 20;
  if (!heroIsAggressor && spot.preflop.heroPos === "BB") score += 20;

  // Texture match — compare flop only (first 3 cards)
  const inputFlop = board.slice(0, 3).map((c) => c.rank);
  const spotFlop = spot.board.slice(0, 3).map((c) => c.rank);
  const sharedRanks = inputFlop.filter((r) => spotFlop.includes(r)).length;
  score += sharedRanks * 12;

  // Same high card?
  if (inputFlop[0] === spotFlop[0]) score += 15;

  // Same paired-ness?
  const inputPaired = inputFlop.some((r, i) => inputFlop.indexOf(r) !== i);
  const spotPaired = spotFlop.some((r, i) => spotFlop.indexOf(r) !== i);
  if (inputPaired === spotPaired) score += 8;

  // Stack proximity
  score -= Math.abs(spot.heroStackBB - input.effectiveBB) * 0.5;

  return score;
}

function isHeroAggressor(input: HandInput): boolean {
  // If the last non-fold preflop action belongs to hero, hero is aggressor.
  for (let i = input.preflopActions.length - 1; i >= 0; i--) {
    const a = input.preflopActions[i];
    if (a.action.kind === "fold") continue;
    return a.actor === "hero";
  }
  return false;
}

function matchActionKind(best: Action, chosen: Action): boolean {
  if (best.kind !== chosen.kind) return false;
  if (best.kind === "raise" && chosen.kind === "raise") {
    // 30% tolerance for sizing
    return Math.abs(best.sizeBB - chosen.sizeBB) / Math.max(best.sizeBB, 1) <= 0.3;
  }
  return true;
}

function estimatePostflopEvLoss(best: Action, chosen: Action, potBB: number): number {
  if (best.kind === chosen.kind) return 0.1;
  // Big mismatches (fold vs bet, check vs jam) cost more
  if ((best.kind === "raise" || best.kind === "jam") && chosen.kind === "fold")
    return Math.min(2, potBB * 0.3);
  if (best.kind === "check" && (chosen.kind === "raise" || chosen.kind === "jam"))
    return 0.5;
  return 0.4;
}

function postflopHeuristic(
  input: HandInput,
  street: Street,
  action: Action,
  board: Card[],
): AnalyzedStep {
  const texture = boardTexture(board);

  // Detect rough hand strength against texture
  const heroRanks = input.heroCards.map((c) => c.rank);
  const boardRanks = board.map((c) => c.rank);
  const madeTop =
    heroRanks.some((r) => r === boardRanks[0]) || // top pair
    (heroRanks[0] === heroRanks[1] && rankValue(heroRanks[0]) > rankValue(boardRanks[0])); // overpair
  const madeAny = heroRanks.some((r) => boardRanks.includes(r));

  // Suggested action by simple rules
  let suggested: ActionKind;
  if (madeTop) suggested = "raise"; // value bet
  else if (!madeAny && (action.kind === "raise" || action.kind === "jam")) suggested = "check";
  else suggested = "check";

  const aligned = action.kind === suggested ||
    (suggested === "raise" && action.kind === "call");
  const tone = aligned ? "good" : "warn";

  return {
    street,
    actor: "hero",
    action,
    evLossBB: aligned ? 0 : 0.25,
    verdict: "heuristic",
    tone,
    headline: aligned
      ? `${labelAction(action)} no ${streetLabel(street)} parece razoável`
      : `${labelAction(action)} no ${streetLabel(street)} — heurística sugere ${labelActionKind(suggested)}`,
    reasoning:
      `Sem spot pré-resolvido para board ${board.map(cardCode).join(" ")} (${texture}). ` +
      `Análise por heurística: ${madeTop ? "você tem top pair/overpair — value bet padrão." : madeAny ? "pair médio — pot control geralmente certo." : "sem made hand — check é default fora de posição."} ` +
      `Para análise precisa, jogue tópicos do treino com esta textura.`,
  };
}

/* ─────────── narration ─────────── */

function narrateVillainStep(street: "preflop" | Street, action: Action): AnalyzedStep {
  return {
    street,
    actor: "villain",
    action,
    evLossBB: null,
    verdict: "heuristic",
    tone: "muted",
    headline: `Vilão: ${labelAction(action)}`,
    reasoning: "",
  };
}

/* ─────────── helpers ─────────── */

function labelAction(a: Action): string {
  if (a.kind === "raise") return `Raise ${a.sizeBB}BB`;
  return labelActionKind(a.kind);
}

function labelActionKind(k: ActionKind): string {
  return { fold: "Fold", call: "Call", raise: "Raise", jam: "All-in", check: "Check" }[k];
}

function streetLabel(s: Street): string {
  return { flop: "flop", turn: "turn", river: "river" }[s];
}

function cardCode(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function rankValue(r: Rank): number {
  return "23456789TJQKA".indexOf(r);
}

export function parseCardString(s: string): Card | null {
  if (!s || s.length < 2) return null;
  const upper = s[0].toUpperCase();
  const lower = s[1].toLowerCase();
  if (!"23456789TJQKA".includes(upper)) return null;
  if (!"shdc".includes(lower)) return null;
  return { rank: upper as Rank, suit: lower as Suit };
}

export function isValidBoardCount(street: Street): number {
  return { flop: 3, turn: 1, river: 1 }[street];
}
