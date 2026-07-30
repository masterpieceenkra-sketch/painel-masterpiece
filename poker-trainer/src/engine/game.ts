import type { Action, ActionKind, Card } from "@/domain/cards";
import { evaluateHand, type EvaluatedHand } from "./handEval";
import { fullDeck } from "./equity";

/**
 * Máquina de estados de uma mão heads-up NLHE.
 * Convenções:
 * - Blinds fixos: SB 0.5BB / BB 1BB. O button posta o SB e age primeiro
 *   pré-flop; pós-flop o button age por último.
 * - `raise.sizeBB` significa "raise PARA X" — total comprometido do jogador
 *   naquele street após a ação (não o incremento).
 * - Sem side pots: no acerto final, aposta não-paga (uncalled) volta para
 *   quem apostou antes de premiar o vencedor.
 */

export type PlayerId = "hero" | "bot";
export type StreetName = "preflop" | "flop" | "turn" | "river";

export const SMALL_BLIND = 0.5;
export const BIG_BLIND = 1;

export type PlayerHandState = {
  cards: [Card, Card];
  /** Fichas atrás (fora do pote), em BB. */
  stackBB: number;
  /** Comprometido neste street. */
  committedBB: number;
  /** Comprometido na mão inteira. */
  totalBB: number;
  folded: boolean;
  allIn: boolean;
  /** Já agiu desde o último raise deste street. */
  acted: boolean;
};

export type HandEvent = {
  street: StreetName;
  actor: PlayerId;
  action: Action;
  /** Pote total (coletado + comprometido) após a ação. */
  potAfterBB: number;
};

export type HandResult = {
  winner: PlayerId | "split";
  /** Pote disputado (já sem a parte não-paga devolvida). */
  potBB: number;
  reason: "fold" | "showdown";
  showdown?: { hero: EvaluatedHand; bot: EvaluatedHand };
};

export type HandState = {
  button: PlayerId;
  street: StreetName;
  deck: Card[];
  board: Card[];
  players: Record<PlayerId, PlayerHandState>;
  /** Fichas coletadas de streets anteriores. */
  potBB: number;
  toAct: PlayerId | null;
  /** Último incremento de raise no street (para min-raise). */
  lastRaiseIncrementBB: number;
  history: HandEvent[];
  result: HandResult | null;
};

export function otherPlayer(id: PlayerId): PlayerId {
  return id === "hero" ? "bot" : "hero";
}

/** Pote total contando o que está comprometido no street atual. */
export function totalPot(state: HandState): number {
  return state.potBB + state.players.hero.committedBB + state.players.bot.committedBB;
}

export function effectiveStackBB(state: HandState): number {
  const h = state.players.hero;
  const b = state.players.bot;
  return Math.min(h.stackBB + h.totalBB, b.stackBB + b.totalBB);
}

function shuffled(rng: () => number): Card[] {
  const deck = fullDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function startHand(
  stacks: { hero: number; bot: number },
  button: PlayerId,
  rng: () => number = Math.random,
): HandState {
  const deck = shuffled(rng);
  const heroCards: [Card, Card] = [deck.pop()!, deck.pop()!];
  const botCards: [Card, Card] = [deck.pop()!, deck.pop()!];

  const makePlayer = (cards: [Card, Card], stackBB: number): PlayerHandState => ({
    cards,
    stackBB,
    committedBB: 0,
    totalBB: 0,
    folded: false,
    allIn: false,
    acted: false,
  });

  const state: HandState = {
    button,
    street: "preflop",
    deck,
    board: [],
    players: {
      hero: makePlayer(heroCards, stacks.hero),
      bot: makePlayer(botCards, stacks.bot),
    },
    potBB: 0,
    toAct: null,
    lastRaiseIncrementBB: BIG_BLIND,
    history: [],
    result: null,
  };

  // Posta blinds (limitados ao stack — all-in forçado com stack curtíssimo).
  postBlind(state, button, SMALL_BLIND);
  postBlind(state, otherPlayer(button), BIG_BLIND);

  state.toAct = state.players[button].allIn ? otherPlayer(button) : button;
  // Se ambos entraram all-in só com os blinds, corre a mão inteira.
  if (state.players.hero.allIn && state.players.bot.allIn) {
    runOutBoard(state);
    settleShowdown(state);
    state.toAct = null;
  } else if (state.players[state.toAct!].allIn) {
    state.toAct = otherPlayer(state.toAct!);
  }
  return state;
}

function postBlind(state: HandState, id: PlayerId, amount: number) {
  const p = state.players[id];
  const paid = Math.min(amount, p.stackBB);
  p.stackBB -= paid;
  p.committedBB += paid;
  p.totalBB += paid;
  if (p.stackBB === 0) p.allIn = true;
}

/* ─────────── ações legais ─────────── */

export type LegalActions = {
  kinds: ActionKind[];
  /** Quanto falta pagar para dar call (já limitado ao stack). */
  callAmountBB: number;
  /** Raise mínimo (valor "para", no street). */
  minRaiseToBB: number;
  /** Raise máximo = all-in (valor "para", no street). */
  maxRaiseToBB: number;
  potTotalBB: number;
};

export function legalActions(state: HandState, actor: PlayerId): LegalActions {
  const me = state.players[actor];
  const opp = state.players[otherPlayer(actor)];
  const owed = Math.max(0, opp.committedBB - me.committedBB);
  const callAmountBB = Math.min(owed, me.stackBB);
  const maxRaiseToBB = me.committedBB + me.stackBB;
  const minRaiseToBB = Math.min(
    opp.committedBB + Math.max(state.lastRaiseIncrementBB, BIG_BLIND),
    maxRaiseToBB,
  );

  const kinds: ActionKind[] = [];
  if (owed > 0) {
    kinds.push("fold", "call");
  } else {
    kinds.push("check");
  }
  // Raise só é possível se sobra stack além do call e o oponente pode reagir
  // ou o raise tem tamanho legal.
  if (me.stackBB > callAmountBB && !opp.allIn) {
    kinds.push("raise", "jam");
  }
  return {
    kinds,
    callAmountBB,
    minRaiseToBB,
    maxRaiseToBB,
    potTotalBB: totalPot(state),
  };
}

/* ─────────── aplicar ação ─────────── */

export function applyAction(prev: HandState, actor: PlayerId, action: Action): HandState {
  if (prev.result || prev.toAct !== actor) return prev;
  const state = structuredClone(prev);
  const me = state.players[actor];
  const oppId = otherPlayer(actor);
  const opp = state.players[oppId];
  const la = legalActions(state, actor);

  const record = (a: Action) =>
    state.history.push({ street: state.street, actor, action: a, potAfterBB: totalPot(state) });

  switch (action.kind) {
    case "fold": {
      me.folded = true;
      record(action);
      settleFold(state, oppId);
      return state;
    }
    case "check": {
      if (la.callAmountBB > 0) return prev; // ilegal
      me.acted = true;
      record(action);
      maybeAdvance(state);
      return state;
    }
    case "call": {
      const pay = la.callAmountBB;
      me.stackBB -= pay;
      me.committedBB += pay;
      me.totalBB += pay;
      if (me.stackBB === 0) me.allIn = true;
      me.acted = true;
      record(action);
      maybeAdvance(state);
      return state;
    }
    case "raise":
    case "jam": {
      let target =
        action.kind === "jam"
          ? la.maxRaiseToBB
          : Math.min(Math.max(action.sizeBB, la.minRaiseToBB), la.maxRaiseToBB);
      // Pagar o que deve + incremento; converte "para X" em delta.
      const delta = target - me.committedBB;
      if (delta <= 0 || opp.allIn) return prev; // ilegal
      me.stackBB -= delta;
      me.committedBB = target;
      me.totalBB += delta;
      if (me.stackBB === 0) {
        me.allIn = true;
        target = me.committedBB;
      }
      state.lastRaiseIncrementBB = Math.max(
        target - opp.committedBB,
        state.lastRaiseIncrementBB,
      );
      me.acted = true;
      opp.acted = opp.allIn; // oponente precisa reagir, a menos que esteja all-in
      record(me.allIn ? { kind: "jam" } : { kind: "raise", sizeBB: target });
      if (opp.allIn) {
        maybeAdvance(state);
      } else {
        state.toAct = oppId;
      }
      return state;
    }
  }
}

/* ─────────── fluxo de streets ─────────── */

function maybeAdvance(state: HandState) {
  const h = state.players.hero;
  const b = state.players.bot;
  const bothMatched = h.committedBB === b.committedBB || h.allIn || b.allIn;
  const bothActed = (h.acted || h.allIn) && (b.acted || b.allIn);

  if (!(bothMatched && bothActed)) {
    state.toAct = otherPlayer(state.toAct!);
    if (state.players[state.toAct!].allIn) state.toAct = otherPlayer(state.toAct!);
    return;
  }

  if (h.allIn || b.allIn) {
    runOutBoard(state);
    settleShowdown(state);
    return;
  }

  if (state.street === "river") {
    settleShowdown(state);
    return;
  }

  collectStreet(state);
  dealNextStreet(state);
  // Pós-flop: quem NÃO tem o button age primeiro.
  state.toAct = otherPlayer(state.button);
}

function collectStreet(state: HandState) {
  for (const id of ["hero", "bot"] as PlayerId[]) {
    const p = state.players[id];
    state.potBB += p.committedBB;
    p.committedBB = 0;
    p.acted = false;
  }
  state.lastRaiseIncrementBB = BIG_BLIND;
}

function dealNextStreet(state: HandState) {
  if (state.street === "preflop") {
    state.board.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
    state.street = "flop";
  } else if (state.street === "flop") {
    state.board.push(state.deck.pop()!);
    state.street = "turn";
  } else if (state.street === "turn") {
    state.board.push(state.deck.pop()!);
    state.street = "river";
  }
}

function runOutBoard(state: HandState) {
  collectStreet(state);
  while (state.street !== "river") {
    dealNextStreet(state);
  }
}

/* ─────────── acerto ─────────── */

function settleFold(state: HandState, winner: PlayerId) {
  const pot = totalPot(state);
  state.players[winner].stackBB += pot;
  clearCommitted(state);
  state.result = { winner, potBB: pot, reason: "fold" };
  state.toAct = null;
}

function settleShowdown(state: HandState) {
  const h = state.players.hero;
  const b = state.players.bot;
  // Devolve aposta não-paga antes de disputar.
  const uncalled = h.totalBB - b.totalBB;
  if (uncalled > 0) h.stackBB += uncalled;
  else if (uncalled < 0) b.stackBB += -uncalled;
  const contested = h.totalBB + b.totalBB - Math.abs(uncalled);

  const heroEval = evaluateHand([...h.cards, ...state.board]);
  const botEval = evaluateHand([...b.cards, ...state.board]);

  let winner: PlayerId | "split";
  if (heroEval.score > botEval.score) winner = "hero";
  else if (botEval.score > heroEval.score) winner = "bot";
  else winner = "split";

  if (winner === "split") {
    h.stackBB += contested / 2;
    b.stackBB += contested / 2;
  } else {
    state.players[winner].stackBB += contested;
  }
  clearCommitted(state);
  state.result = {
    winner,
    potBB: contested,
    reason: "showdown",
    showdown: { hero: heroEval, bot: botEval },
  };
  state.toAct = null;
}

function clearCommitted(state: HandState) {
  state.potBB = 0;
  state.players.hero.committedBB = 0;
  state.players.bot.committedBB = 0;
}
