import type { Card, Rank, Suit } from "@/domain/cards";

/**
 * Avaliador de mãos de 5 a 7 cartas. Retorna um score numérico comparável
 * (maior = melhor) + categoria + rótulo pt-BR. Usado no showdown do jogo
 * heads-up e nos rollouts Monte Carlo da calculadora de equity.
 */

export type HandCategory =
  | "highcard"
  | "pair"
  | "twopair"
  | "trips"
  | "straight"
  | "flush"
  | "fullhouse"
  | "quads"
  | "straightflush";

export type EvaluatedHand = {
  category: HandCategory;
  /** Score empacotado base-15: categoria + até 5 desempates. Comparável com >. */
  score: number;
  labelPt: string;
};

const CATEGORY_ORDER: Record<HandCategory, number> = {
  highcard: 0,
  pair: 1,
  twopair: 2,
  trips: 3,
  straight: 4,
  flush: 5,
  fullhouse: 6,
  quads: 7,
  straightflush: 8,
};

const CATEGORY_LABEL_PT: Record<HandCategory, string> = {
  highcard: "Carta alta",
  pair: "Par",
  twopair: "Dois pares",
  trips: "Trinca",
  straight: "Sequência",
  flush: "Flush",
  fullhouse: "Full house",
  quads: "Quadra",
  straightflush: "Straight flush",
};

const RANK_ORDER = "23456789TJQKA";

export function rankValue(r: Rank): number {
  return RANK_ORDER.indexOf(r) + 2; // 2..14
}

function valueToRank(v: number): Rank {
  return RANK_ORDER[v - 2] as Rank;
}

function pack(category: HandCategory, tiebreaks: number[]): number {
  let score = CATEGORY_ORDER[category];
  for (let i = 0; i < 5; i++) {
    score = score * 15 + (tiebreaks[i] ?? 0);
  }
  return score;
}

/**
 * Encontra a maior sequência dentro de um conjunto de valores (2..14).
 * A conta como 1 para a wheel (A-2-3-4-5). Retorna a carta alta da
 * sequência ou null.
 */
function bestStraightHigh(values: Set<number>): number | null {
  const vals = new Set(values);
  if (vals.has(14)) vals.add(1); // wheel
  for (let high = 14; high >= 5; high--) {
    let ok = true;
    for (let v = high; v > high - 5; v--) {
      if (!vals.has(v)) {
        ok = false;
        break;
      }
    }
    if (ok) return high;
  }
  return null;
}

export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateHand espera 5-7 cartas, recebeu ${cards.length}`);
  }

  const counts = new Map<number, number>();
  const bySuit = new Map<Suit, number[]>();
  for (const c of cards) {
    const v = rankValue(c.rank);
    counts.set(v, (counts.get(v) ?? 0) + 1);
    const arr = bySuit.get(c.suit) ?? [];
    arr.push(v);
    bySuit.set(c.suit, arr);
  }

  // Flush / straight flush
  let flushValues: number[] | null = null;
  for (const arr of bySuit.values()) {
    if (arr.length >= 5) {
      flushValues = [...arr].sort((a, b) => b - a);
      break;
    }
  }
  if (flushValues) {
    const sfHigh = bestStraightHigh(new Set(flushValues));
    if (sfHigh != null) {
      return {
        category: "straightflush",
        score: pack("straightflush", [sfHigh]),
        labelPt:
          sfHigh === 14
            ? "Royal flush"
            : `Straight flush até ${valueToRank(sfHigh)}`,
      };
    }
  }

  // Grupos por multiplicidade, ordenados por (count desc, valor desc)
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const kickersExcluding = (used: number[]): number[] =>
    [...counts.keys()]
      .filter((v) => !used.includes(v))
      .sort((a, b) => b - a);

  const [g1, g2] = groups;

  if (g1[1] === 4) {
    const kicker = kickersExcluding([g1[0]])[0] ?? 0;
    return {
      category: "quads",
      score: pack("quads", [g1[0], kicker]),
      labelPt: `Quadra de ${valueToRank(g1[0])}`,
    };
  }

  if (g1[1] === 3 && g2 && g2[1] >= 2) {
    return {
      category: "fullhouse",
      score: pack("fullhouse", [g1[0], g2[0]]),
      labelPt: `Full house (${valueToRank(g1[0])} cheio de ${valueToRank(g2[0])})`,
    };
  }

  if (flushValues) {
    const top5 = flushValues.slice(0, 5);
    return {
      category: "flush",
      score: pack("flush", top5),
      labelPt: `Flush ${valueToRank(top5[0])}-high`,
    };
  }

  const straightHigh = bestStraightHigh(new Set(counts.keys()));
  if (straightHigh != null) {
    return {
      category: "straight",
      score: pack("straight", [straightHigh]),
      labelPt: `Sequência até ${valueToRank(straightHigh)}`,
    };
  }

  if (g1[1] === 3) {
    const ks = kickersExcluding([g1[0]]).slice(0, 2);
    return {
      category: "trips",
      score: pack("trips", [g1[0], ...ks]),
      labelPt: `Trinca de ${valueToRank(g1[0])}`,
    };
  }

  if (g1[1] === 2 && g2 && g2[1] === 2) {
    const kicker = kickersExcluding([g1[0], g2[0]])[0] ?? 0;
    return {
      category: "twopair",
      score: pack("twopair", [g1[0], g2[0], kicker]),
      labelPt: `Dois pares (${valueToRank(g1[0])} e ${valueToRank(g2[0])})`,
    };
  }

  if (g1[1] === 2) {
    const ks = kickersExcluding([g1[0]]).slice(0, 3);
    return {
      category: "pair",
      score: pack("pair", [g1[0], ...ks]),
      labelPt: `Par de ${valueToRank(g1[0])}`,
    };
  }

  const top5 = [...counts.keys()].sort((a, b) => b - a).slice(0, 5);
  return {
    category: "highcard",
    score: pack("highcard", top5),
    labelPt: `Carta alta ${valueToRank(top5[0])}`,
  };
}

export const CATEGORY_LABEL = CATEGORY_LABEL_PT;

/* ─────────── draws (flop/turn) ─────────── */

export type DrawInfo = {
  flushDraw: boolean;
  /** Flush draw segurando o A do naipe (nut flush draw). */
  nutFlushDraw: boolean;
  /** Open-ended / double-gutter: 2+ valores distintos completam sequência. */
  oesd: boolean;
  gutshot: boolean;
  /** Quantas cartas do herói são overcards ao board. */
  overcards: number;
};

export function detectDraws(hero: [Card, Card], board: Card[]): DrawInfo {
  const all = [...hero, ...board];
  const none: DrawInfo = {
    flushDraw: false,
    nutFlushDraw: false,
    oesd: false,
    gutshot: false,
    overcards: 0,
  };
  if (board.length >= 5) return none;

  // Flush draw: exatamente 4 do mesmo naipe, com ≥1 carta do herói.
  let flushDraw = false;
  let nutFlushDraw = false;
  for (const suit of ["s", "h", "d", "c"] as Suit[]) {
    const total = all.filter((c) => c.suit === suit).length;
    const heroHas = hero.some((c) => c.suit === suit);
    if (total === 4 && heroHas) {
      flushDraw = true;
      nutFlushDraw = hero.some((c) => c.suit === suit && c.rank === "A");
    }
  }

  // Straight draw: valores ausentes que completariam uma janela de 5.
  const values = new Set(all.map((c) => rankValue(c.rank)));
  if (values.has(14)) values.add(1);
  const alreadyStraight = bestStraightHigh(values) != null;
  const outs = new Set<number>();
  if (!alreadyStraight) {
    for (let missing = 1; missing <= 14; missing++) {
      if (values.has(missing)) continue;
      const withCard = new Set(values);
      withCard.add(missing);
      if (missing === 14) withCard.add(1);
      const high = bestStraightHigh(withCard);
      // A sequência completada precisa usar a carta que entrou.
      if (high != null && missing >= high - 4 && missing <= high) {
        outs.add(missing === 1 ? 14 : missing);
      }
    }
  }

  const boardMax = Math.max(...board.map((c) => rankValue(c.rank)));
  const overcards = hero.filter((c) => rankValue(c.rank) > boardMax).length;

  return {
    flushDraw,
    nutFlushDraw,
    oesd: outs.size >= 2,
    gutshot: outs.size === 1,
    overcards,
  };
}
