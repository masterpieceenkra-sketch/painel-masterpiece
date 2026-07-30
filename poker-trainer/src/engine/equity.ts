import { RANKS, SUITS, type Card, type HandCode, type Rank } from "@/domain/cards";
import { evaluateHand } from "./handEval";

/**
 * Calculadora de equity Monte Carlo: simula runouts contra uma range de
 * combos do vilão e devolve a fração de potes ganhos (empates contam meio).
 * Também expõe um ranking percentílico das 169 mãos (fórmula de Chen) usado
 * pelo bot para modelar a range do oponente ("top X%").
 */

export function cardKey(c: Card): string {
  return c.rank + c.suit;
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/* ─────────── ranking pré-flop (fórmula de Chen) ─────────── */

function chenHighCardPoints(r: Rank): number {
  if (r === "A") return 10;
  if (r === "K") return 8;
  if (r === "Q") return 7;
  if (r === "J") return 6;
  return ("23456789T".indexOf(r) + 2) / 2;
}

export function chenScore(hi: Rank, lo: Rank, suited: boolean): number {
  const hiVal = "23456789TJQKA".indexOf(hi) + 2;
  const loVal = "23456789TJQKA".indexOf(lo) + 2;
  let score = chenHighCardPoints(hi);
  if (hi === lo) return Math.max(5, score * 2);
  if (suited) score += 2;
  const gap = hiVal - loVal - 1;
  if (gap === 1) score -= 1;
  else if (gap === 2) score -= 2;
  else if (gap === 3) score -= 4;
  else if (gap >= 4) score -= 5;
  if (gap <= 1 && hiVal < 12) score += 1; // bônus de conectividade
  return score;
}

type RankedHand = { code: HandCode; combos: number; cumulativePct: number };

function buildRanking(): RankedHand[] {
  const entries: { code: HandCode; combos: number; chen: number; hiVal: number }[] = [];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    for (let j = i; j >= 0; j--) {
      const hi = RANKS[i];
      const lo = RANKS[j];
      if (hi === lo) {
        entries.push({ code: `${hi}${lo}`, combos: 6, chen: chenScore(hi, lo, false), hiVal: i });
      } else {
        entries.push({ code: `${hi}${lo}s`, combos: 4, chen: chenScore(hi, lo, true), hiVal: i });
        entries.push({ code: `${hi}${lo}o`, combos: 12, chen: chenScore(hi, lo, false), hiVal: i });
      }
    }
  }
  entries.sort((a, b) => b.chen - a.chen || b.hiVal - a.hiVal);
  const out: RankedHand[] = [];
  let cumulative = 0;
  for (const e of entries) {
    cumulative += e.combos;
    out.push({ code: e.code, combos: e.combos, cumulativePct: cumulative / 1326 });
  }
  return out;
}

export const HAND_RANKING: RankedHand[] = buildRanking();

const PERCENTILE_BY_CODE = new Map<HandCode, number>(
  HAND_RANKING.map((h) => [h.code, h.cumulativePct]),
);

/** Percentil da mão (0 = melhor mão, 1 = pior). AA ≈ 0.005, 72o ≈ 1. */
export function percentileOf(code: HandCode): number {
  return PERCENTILE_BY_CODE.get(code) ?? 1;
}

function expandCode(code: HandCode): [Card, Card][] {
  const hi = code[0] as Rank;
  const lo = code[1] as Rank;
  const combos: [Card, Card][] = [];
  if (hi === lo) {
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push([
          { rank: hi, suit: SUITS[i] },
          { rank: lo, suit: SUITS[j] },
        ]);
      }
    }
    return combos;
  }
  const suited = code[2] === "s";
  for (const sHi of SUITS) {
    for (const sLo of SUITS) {
      if (suited && sHi !== sLo) continue;
      if (!suited && sHi === sLo) continue;
      combos.push([
        { rank: hi, suit: sHi },
        { rank: lo, suit: sLo },
      ]);
    }
  }
  return combos;
}

/**
 * Expande a range "top pct" (0..1) em combos concretos, removendo cartas
 * mortas (mão do herói + board).
 */
export function topRangeCombos(pct: number, dead: Card[]): [Card, Card][] {
  const deadSet = new Set(dead.map(cardKey));
  const combos: [Card, Card][] = [];
  for (const ranked of HAND_RANKING) {
    if (ranked.cumulativePct > pct && combos.length > 0) break;
    for (const combo of expandCode(ranked.code)) {
      if (deadSet.has(cardKey(combo[0])) || deadSet.has(cardKey(combo[1]))) continue;
      combos.push(combo);
    }
    if (ranked.cumulativePct > pct) break;
  }
  return combos;
}

/* ─────────── Monte Carlo ─────────── */

export type EquityResult = {
  equity: number; // 0..1
  iterations: number;
};

export function equityVsCombos(
  hero: [Card, Card],
  board: Card[],
  villainCombos: [Card, Card][],
  iterations = 1200,
  rng: () => number = Math.random,
): EquityResult {
  const deadSet = new Set([...hero, ...board].map(cardKey));
  const combos = villainCombos.filter(
    (c) => !deadSet.has(cardKey(c[0])) && !deadSet.has(cardKey(c[1])),
  );
  if (combos.length === 0) return { equity: 0.5, iterations: 0 };

  const baseDeck = fullDeck().filter((c) => !deadSet.has(cardKey(c)));
  const need = 5 - board.length;
  let wins = 0;

  for (let it = 0; it < iterations; it++) {
    const villain = combos[Math.floor(rng() * combos.length)];
    const vKeys = [cardKey(villain[0]), cardKey(villain[1])];

    // Completa o board com cartas aleatórias que não conflitam.
    const runout: Card[] = [];
    if (need > 0) {
      const pool = baseDeck.filter((c) => !vKeys.includes(cardKey(c)));
      for (let k = 0; k < need; k++) {
        const idx = k + Math.floor(rng() * (pool.length - k));
        const tmp = pool[k];
        pool[k] = pool[idx];
        pool[idx] = tmp;
        runout.push(pool[k]);
      }
    }

    const fullBoard = [...board, ...runout];
    const heroEval = evaluateHand([...hero, ...fullBoard]);
    const villainEval = evaluateHand([...villain, ...fullBoard]);
    if (heroEval.score > villainEval.score) wins += 1;
    else if (heroEval.score === villainEval.score) wins += 0.5;
  }

  return { equity: wins / iterations, iterations };
}
