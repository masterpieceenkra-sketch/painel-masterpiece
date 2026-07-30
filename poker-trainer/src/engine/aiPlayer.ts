import type { Action, ActionKind, Card } from "@/domain/cards";
import type { PostflopSpot } from "@/domain/postflop";
import { getMix, normalizeMix, type FrequencyMix, type PreflopRange } from "@/domain/range";
import {
  effectiveStackBB,
  legalActions,
  otherPlayer,
  type HandState,
  type LegalActions,
  type PlayerId,
} from "./game";
import { equityVsCombos, percentileOf, topRangeCombos } from "./equity";
import { detectDraws, evaluateHand, rankValue, type DrawInfo } from "./handEval";
import { handCodeOf } from "./handCode";

/**
 * O cérebro do bot GTO em 3 camadas:
 * 1. Pré-flop → ranges Nash reais compiladas (joga o mix por frequência).
 * 2. Pós-flop → equity Monte Carlo vs range modelada + regras GTO de sizing.
 * 3. Citação da biblioteca de spots resolvidos quando a textura casa.
 * Toda decisão vem com raciocínio em pt-BR.
 */

export type BotContext = {
  ranges: PreflopRange[];
  postflopSpots: PostflopSpot[];
};

export type BotDecision = {
  action: Action;
  headline: string;
  reasoning: string;
  meta: {
    layer: "range" | "montecarlo" | "heuristic";
    equity?: number;
    potOddsPct?: number;
    handLabel?: string;
    rangeId?: string;
    similarSpotId?: string;
  };
};

export function botDecide(
  state: HandState,
  botId: PlayerId,
  ctx: BotContext,
  rng: () => number = Math.random,
): BotDecision {
  const la = legalActions(state, botId);
  const decision =
    state.street === "preflop"
      ? decidePreflop(state, botId, ctx, la, rng)
      : decidePostflop(state, botId, ctx, la, rng);
  decision.action = sanitize(decision.action, la);
  decision.headline = `Bot: ${labelAction(decision.action, la)}`;
  return decision;
}

/** Garante que a ação escolhida é legal; degrada para a opção mais próxima. */
function sanitize(action: Action, la: LegalActions): Action {
  if (action.kind === "check" && !la.kinds.includes("check")) {
    return la.kinds.includes("call") ? { kind: "call" } : { kind: "fold" };
  }
  if (action.kind === "call" && !la.kinds.includes("call")) return { kind: "check" };
  if ((action.kind === "raise" || action.kind === "jam") && !la.kinds.includes("raise")) {
    return la.kinds.includes("call") ? { kind: "call" } : { kind: "check" };
  }
  if (action.kind === "raise") {
    const size = Math.min(Math.max(action.sizeBB, la.minRaiseToBB), la.maxRaiseToBB);
    if (size >= la.maxRaiseToBB - 0.01) return { kind: "jam" };
    return { kind: "raise", sizeBB: roundBB(size) };
  }
  return action;
}

/* ─────────── pré-flop ─────────── */

function decidePreflop(
  state: HandState,
  botId: PlayerId,
  ctx: BotContext,
  la: LegalActions,
  rng: () => number,
): BotDecision {
  const me = state.players[botId];
  const opp = state.players[otherPlayer(botId)];
  const code = handCodeOf(me.cards[0], me.cards[1]);
  const pct = percentileOf(code);
  const eff = effectiveStackBB(state);
  const isButton = state.button === botId;

  // ── Button first-in (só blinds no pote) ──
  if (isButton && opp.committedBB <= 1 && me.committedBB <= 0.5) {
    if (eff <= 14) {
      const range = closestRange(ctx.ranges, ["nash-7bb-btn-jam", "nash-10bb-sb-jam", "nash-15bb-sb-jam"], eff);
      if (range) {
        const mix = getMix(range, code);
        const jamFreq = (mix.jam ?? 0) + (mix.raise ?? 0);
        const jam = rng() < jamFreq;
        return {
          action: jam ? { kind: "jam" } : { kind: "fold" },
          headline: "",
          reasoning:
            `Stack curto (${fmt(eff)}BB efetivos) no button — regime push/fold. ` +
            `Consultei a range Nash "${range.label}": ${code} ${freqPhrase(jamFreq, "jam")}. ` +
            (jam
              ? `Jam aproveita fold equity + equity quando pago; open-raise/fold desperdiçaria a stack.`
              : `Fold preserva as fichas — jam aqui queima EV contra a range de call do BB.`),
          meta: { layer: "range", rangeId: range.id },
        };
      }
    }
    // Fundo: open padrão HU ~75-80%
    if (pct <= 0.72) {
      return {
        action: { kind: "raise", sizeBB: 2.5 },
        headline: "",
        reasoning:
          `HU no button abre-se ~75% das mãos: posição + iniciativa compensam mãos medianas. ` +
          `${code} está no top ${pctFmt(pct)} do ranking pré-flop — open 2.5BB padrão.`,
        meta: { layer: "heuristic" },
      };
    }
    if (pct <= 0.85 && rng() < 0.35) {
      return {
        action: { kind: "raise", sizeBB: 2.5 },
        headline: "",
        reasoning:
          `${code} é marginal (top ${pctFmt(pct)}), mas HU o button rouba blinds com frequência — ` +
          `abro como steal em parte das vezes para não ficar previsível.`,
        meta: { layer: "heuristic" },
      };
    }
    return {
      action: { kind: "fold" },
      headline: "",
      reasoning: `${code} está fora do top ~80% (percentil ${pctFmt(pct)}). Mesmo HU, essa mão perde dinheiro no longo prazo — fold.`,
      meta: { layer: "heuristic" },
    };
  }

  // ── BB com opção após limp ──
  if (!isButton && la.callAmountBB === 0) {
    if (pct <= 0.3) {
      return {
        action: { kind: "raise", sizeBB: 3.5 },
        headline: "",
        reasoning: `Você limpou e ${code} está no top ${pctFmt(pct)} — raise para punir o limp e jogar um pote maior com iniciativa.`,
        meta: { layer: "heuristic" },
      };
    }
    return {
      action: { kind: "check" },
      headline: "",
      reasoning: `${code} não é forte o bastante para inflar o pote fora de posição — check e vejo o flop de graça.`,
      meta: { layer: "heuristic" },
    };
  }

  // ── Enfrentando agressão ──
  const facingJam = opp.allIn || opp.committedBB >= 0.6 * eff;
  const iRaisedBefore = me.committedBB > 1;

  if (facingJam) {
    if (!isButton && eff <= 16) {
      const range = closestRange(ctx.ranges, ["nash-12bb-bb-call", "nash-10bb-bb-call-btn"], eff);
      if (range) {
        const mix = getMix(range, code);
        const callFreq = (mix.call ?? 0) + (mix.jam ?? 0) + (mix.raise ?? 0);
        const call = rng() < callFreq;
        return {
          action: call ? { kind: "call" } : { kind: "fold" },
          headline: "",
          reasoning:
            `All-in contra mim com ${fmt(eff)}BB efetivos. Range Nash "${range.label}": ${code} ${freqPhrase(callFreq, "call")}. ` +
            (call ? `As pot odds + equity vs a range de jam justificam o call.` : `Fora da range de call — pagar aqui é queimar EV.`),
          meta: { layer: "range", rangeId: range.id },
        };
      }
    }
    // Monte Carlo pré-flop vs range de jam estimada pela profundidade
    const jamPct = eff <= 10 ? 0.6 : eff <= 15 ? 0.5 : eff <= 25 ? 0.35 : 0.2;
    const combos = topRangeCombos(jamPct, [...me.cards]);
    const { equity } = equityVsCombos(me.cards, [], combos, 800, rng);
    const required = la.callAmountBB / (la.potTotalBB + la.callAmountBB);
    const call = equity >= required + 0.02;
    return {
      action: call ? { kind: "call" } : { kind: "fold" },
      headline: "",
      reasoning:
        `All-in contra mim. Modelei a range de jam como top ${pctFmt(jamPct)} e rodei Monte Carlo: ` +
        `${code} tem ~${pctFmt(equity)} de equity. Pot odds exigem ${pctFmt(required)}. ` +
        (call ? `Equity acima do preço — call correto.` : `Equity abaixo do preço — fold disciplinado.`),
      meta: { layer: "montecarlo", equity, potOddsPct: required },
    };
  }

  if (!iRaisedBefore) {
    // BB defendendo contra open — usa a range real de defesa quando cabe
    if (!isButton && eff >= 15 && eff <= 40) {
      const range = ctx.ranges.find((r) => r.id === "def-bb-vs-btn-25bb");
      if (range) {
        const mix = getMix(range, code);
        const kind = sampleMix(mix, rng);
        if (kind === "raise" || kind === "jam") {
          const target = opp.committedBB * 3.6;
          return {
            action: { kind: "raise", sizeBB: target },
            headline: "",
            reasoning:
              `Defesa de BB vs open — range "${range.label}" (aproximação BB vs BTN): ${code} 3-beta ${freqPhrase(mix.raise ?? 0, "3-bet")}. ` +
              `3-bet fora de posição precisa de mãos que dominam a range de call ou têm bloqueadores.`,
            meta: { layer: "range", rangeId: range.id },
          };
        }
        if (kind === "call") {
          return {
            action: { kind: "call" },
            headline: "",
            reasoning:
              `Defesa de BB: com o desconto do blind, ${code} defende por call (range "${range.label}"). ` +
              `Pagando ${fmt(la.callAmountBB)}BB para ver um pote de ${fmt(la.potTotalBB + la.callAmountBB)}BB.`,
            meta: { layer: "range", rangeId: range.id },
          };
        }
        return {
          action: { kind: "fold" },
          headline: "",
          reasoning: `${code} está fora da range de defesa do BB ("${range.label}") — nem call com desconto se justifica. Fold.`,
          meta: { layer: "range", rangeId: range.id },
        };
      }
    }
    // Fallback por percentil + preço
    const required = la.callAmountBB / (la.potTotalBB + la.callAmountBB);
    if (pct <= 0.1) {
      return {
        action: { kind: "raise", sizeBB: opp.committedBB * 3.5 },
        headline: "",
        reasoning: `${code} está no top ${pctFmt(pct)} — 3-bet para valor: quero pote grande contra a range de open.`,
        meta: { layer: "heuristic" },
      };
    }
    if (pct <= 0.58 && required <= 0.4) {
      return {
        action: { kind: "call" },
        headline: "",
        reasoning:
          `${code} (top ${pctFmt(pct)}) defende por call — HU o BB defende largo: ` +
          `com o desconto do blind, pagar ${pctFmt(required)} do pote é lucrativo contra uma range de open ampla.`,
        meta: { layer: "heuristic" },
      };
    }
    return {
      action: { kind: "fold" },
      headline: "",
      reasoning: `${code} é fraco demais para pagar um raise (percentil ${pctFmt(pct)}). Fold e espero spot melhor.`,
      meta: { layer: "heuristic" },
    };
  }

  // Enfrentando 3-bet (ou mais) depois de eu ter agredido
  const required = la.callAmountBB / (la.potTotalBB + la.callAmountBB);
  if (pct <= 0.045) {
    const action: Action = eff <= 30 ? { kind: "jam" } : { kind: "raise", sizeBB: opp.committedBB * 2.4 };
    return {
      action,
      headline: "",
      reasoning:
        `Fui 3-betado, mas ${code} é premium (top ${pctFmt(pct)}). ` +
        (action.kind === "jam" ? `Com ${fmt(eff)}BB, jam maximiza valor e nega equity.` : `4-bet para valor.`),
      meta: { layer: "heuristic" },
    };
  }
  if (pct <= 0.16 && required <= 0.35) {
    return {
      action: { kind: "call" },
      headline: "",
      reasoning: `3-bet contra meu open: ${code} (top ${pctFmt(pct)}) tem força para pagar ${pctFmt(required)} do pote e jogar o flop.`,
      meta: { layer: "heuristic" },
    };
  }
  return {
    action: { kind: "fold" },
    headline: "",
    reasoning: `3-bet contra meu open e ${code} não aguenta a pressão (percentil ${pctFmt(pct)}). Fold — o open já cumpriu o papel.`,
    meta: { layer: "heuristic" },
  };
}

/* ─────────── pós-flop ─────────── */

function decidePostflop(
  state: HandState,
  botId: PlayerId,
  ctx: BotContext,
  la: LegalActions,
  rng: () => number,
): BotDecision {
  const me = state.players[botId];
  const board = state.board;
  const madeHand = evaluateHand([...me.cards, ...board]);
  const draws = detectDraws(me.cards, board);

  const villainPct = estimateVillainRangePct(state, botId);
  const combos = topRangeCombos(villainPct, [...me.cards, ...board]);
  const { equity } = equityVsCombos(me.cards, board, combos, 1200, rng);

  const pot = la.potTotalBB;
  const facing = la.callAmountBB > 0;
  const wet = isWetBoard(board);
  const street = state.street as "flop" | "turn" | "river";
  const strongDraw = draws.flushDraw || draws.oesd;
  const similar = findSimilarSpot(ctx.postflopSpots, board, street);

  const baseContext =
    `Minha mão: ${madeHand.labelPt}${drawPhrase(draws, street)}. ` +
    `Board ${board.map((c) => c.rank + c.suit).join(" ")} (${wet ? "textura molhada" : "textura seca"}). ` +
    `Equity Monte Carlo vs range estimada do oponente (~top ${pctFmt(villainPct)}): ${pctFmt(equity)}. `;
  const spotNote = similar
    ? ` 📚 Spot parecido na biblioteca: ${similar.id} — solver preferiu ${labelSolvedAction(similar)}.`
    : "";

  const meta = {
    layer: "montecarlo" as const,
    equity,
    handLabel: madeHand.labelPt,
    similarSpotId: similar?.id,
  };

  if (facing) {
    const required = la.callAmountBB / (pot + la.callAmountBB);
    const metaF = { ...meta, potOddsPct: required };

    if (equity >= 0.75) {
      const target = Math.max(la.minRaiseToBB, state.players[otherPlayer(botId)].committedBB * 2.8);
      return {
        action: { kind: "raise", sizeBB: target },
        headline: "",
        reasoning:
          baseContext +
          `Com ${pctFmt(equity)} de equity contra a aposta, raise para valor: quero o pote crescendo enquanto estou na frente.` +
          spotNote,
        meta: metaF,
      };
    }
    if (strongDraw && street !== "river" && rng() < 0.25) {
      const target = Math.max(la.minRaiseToBB, state.players[otherPlayer(botId)].committedBB * 2.6);
      return {
        action: { kind: "raise", sizeBB: target },
        headline: "",
        reasoning:
          baseContext +
          `Semi-bluff raise: meu draw forte tem equity real quando pago, e o raise gera fold equity imediata — duas formas de ganhar.` +
          spotNote,
        meta: metaF,
      };
    }
    if (equity >= required + 0.03 || (strongDraw && street !== "river" && equity >= required - 0.02)) {
      return {
        action: { kind: "call" },
        headline: "",
        reasoning:
          baseContext +
          `Pot odds: pagar ${fmt(la.callAmountBB)}BB num pote de ${fmt(pot + la.callAmountBB)}BB exige ${pctFmt(required)} de equity — tenho ${pctFmt(equity)}. Call correto.` +
          spotNote,
        meta: metaF,
      };
    }
    return {
      action: { kind: "fold" },
      headline: "",
      reasoning:
        baseContext +
        `A aposta exige ${pctFmt(required)} de equity e tenho só ${pctFmt(equity)}. Pagar aqui é queimar fichas — fold.` +
        spotNote,
      meta: metaF,
    };
  }

  // Sem aposta a pagar: decidir entre bet e check
  const betAmount = (frac: number) => Math.max(1, roundBB(pot * frac));

  if (equity >= 0.62) {
    const frac = street === "river" && equity >= 0.8 ? 0.85 : wet ? 0.66 : 0.4;
    return {
      action: { kind: "raise", sizeBB: me.committedBB + betAmount(frac) },
      headline: "",
      reasoning:
        baseContext +
        `Value bet de ${pctFmt(frac)} do pote: extraio de mãos piores` +
        (wet && street !== "river" ? ` e nego equity aos draws — board molhado pede aposta maior.` : `.`) +
        spotNote,
      meta,
    };
  }
  if (strongDraw && street !== "river" && rng() < 0.6) {
    return {
      action: { kind: "raise", sizeBB: me.committedBB + betAmount(0.55) },
      headline: "",
      reasoning:
        baseContext +
        `Semi-bluff: aposto com o draw — ganho o pote agora com fold equity ou completo minha mão quando pago. As duas rotas somam EV positivo.` +
        spotNote,
      meta,
    };
  }
  if (street === "river" && madeHand.category === "highcard" && rng() < 0.3) {
    return {
      action: { kind: "raise", sizeBB: me.committedBB + betAmount(0.65) },
      headline: "",
      reasoning:
        baseContext +
        `Sem showdown value no river — minha mão só ganha fazendo você foldar. Bluff de 65% do pote numa frequência controlada para manter a range equilibrada.` +
        spotNote,
      meta,
    };
  }
  if (equity >= 0.45 && street === "flop" && rng() < 0.2) {
    return {
      action: { kind: "raise", sizeBB: me.committedBB + betAmount(0.33) },
      headline: "",
      reasoning:
        baseContext +
        `Bet pequeno de 33%: equity mediana, mas a aposta barata nega cartas grátis e ganha os potes que ninguém quer.` +
        spotNote,
      meta,
    };
  }
  return {
    action: { kind: "check" },
    headline: "",
    reasoning:
      baseContext +
      (equity >= 0.45
        ? `Equity mediana — check para controlar o pote e realizar equity de graça.`
        : `Equity fraca e sem draw que justifique blefar agora — check e reavalio.`) +
      spotNote,
    meta,
  };
}

/* ─────────── modelagem do oponente ─────────── */

function estimateVillainRangePct(state: HandState, botId: PlayerId): number {
  const vid = otherPlayer(botId);
  const pre = state.history.filter((e) => e.street === "preflop");
  const villainRaises = pre.filter(
    (e) => e.actor === vid && (e.action.kind === "raise" || e.action.kind === "jam"),
  );
  const villainCalled = pre.some((e) => e.actor === vid && e.action.kind === "call");

  let pct: number;
  if (villainRaises.length >= 2) {
    pct = 0.08;
  } else if (villainRaises.length === 1) {
    // 3-bet (raise depois de um raise do bot) é bem mais estreito que open
    const firstVillainRaiseIdx = pre.findIndex(
      (e) => e.actor === vid && (e.action.kind === "raise" || e.action.kind === "jam"),
    );
    const botRaisedBefore = pre
      .slice(0, firstVillainRaiseIdx)
      .some((e) => e.actor === botId && e.action.kind === "raise");
    pct = botRaisedBefore ? 0.13 : 0.55;
  } else if (villainCalled) {
    pct = 0.45;
  } else {
    pct = 0.7;
  }

  const postflopAggro = state.history.filter(
    (e) => e.street !== "preflop" && e.actor === vid && (e.action.kind === "raise" || e.action.kind === "jam"),
  ).length;
  pct *= Math.pow(0.6, postflopAggro);
  return Math.min(0.85, Math.max(0.05, pct));
}

/* ─────────── helpers ─────────── */

function closestRange(
  ranges: PreflopRange[],
  ids: string[],
  eff: number,
): PreflopRange | null {
  let best: PreflopRange | null = null;
  let bestDelta = Infinity;
  for (const id of ids) {
    const r = ranges.find((x) => x.id === id);
    if (!r) continue;
    const delta = Math.abs(r.effectiveBB - eff);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = r;
    }
  }
  return best;
}

function sampleMix(mix: FrequencyMix, rng: () => number): ActionKind {
  const normalized = normalizeMix(mix);
  let r = rng();
  for (const kind of ["jam", "raise", "call", "check", "fold"] as ActionKind[]) {
    const f = normalized[kind] ?? 0;
    if (r < f) return kind;
    r -= f;
  }
  return "fold";
}

function isWetBoard(board: Card[]): boolean {
  const suits = new Map<string, number>();
  for (const c of board) suits.set(c.suit, (suits.get(c.suit) ?? 0) + 1);
  const maxSuit = Math.max(...suits.values());
  if (maxSuit >= (board.length >= 4 ? 3 : 2)) return true;
  const vals = board.map((c) => rankValue(c.rank)).sort((a, b) => a - b);
  for (let i = 0; i + 2 < vals.length; i++) {
    if (vals[i + 2] - vals[i] <= 4) return true;
  }
  return false;
}

function findSimilarSpot(
  spots: PostflopSpot[],
  board: Card[],
  street: "flop" | "turn" | "river",
): PostflopSpot | null {
  let best: PostflopSpot | null = null;
  let bestScore = 0;
  const flopRanks = board.slice(0, 3).map((c) => c.rank);
  const paired = flopRanks.some((r, i) => flopRanks.indexOf(r) !== i);
  for (const s of spots) {
    if (s.street !== street) continue;
    const sRanks = s.board.slice(0, 3).map((c) => c.rank);
    let score = sRanks.filter((r) => flopRanks.includes(r)).length * 12;
    if (sRanks[0] === flopRanks[0]) score += 15;
    const sPaired = sRanks.some((r, i) => sRanks.indexOf(r) !== i);
    if (sPaired === paired) score += 8;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 45 ? best : null;
}

function labelSolvedAction(spot: PostflopSpot): string {
  const a = spot.solution.bestAction;
  if (a.kind === "raise") return `bet/raise ${a.sizeBB}BB`;
  return { fold: "fold", call: "call", check: "check", jam: "all-in" }[a.kind];
}

function drawPhrase(draws: DrawInfo, street: "flop" | "turn" | "river"): string {
  if (street === "river") return "";
  const parts: string[] = [];
  if (draws.nutFlushDraw) parts.push("nut flush draw");
  else if (draws.flushDraw) parts.push("flush draw");
  if (draws.oesd) parts.push("open-ended straight draw");
  else if (draws.gutshot) parts.push("gutshot");
  return parts.length > 0 ? ` + ${parts.join(" + ")}` : "";
}

function labelAction(a: Action, la: LegalActions): string {
  switch (a.kind) {
    case "fold":
      return "Fold";
    case "check":
      return "Check";
    case "call":
      return `Call ${fmt(la.callAmountBB)}BB`;
    case "jam":
      return "All-in";
    case "raise":
      return la.callAmountBB > 0 ? `Raise para ${fmt(a.sizeBB)}BB` : `Bet ${fmt(a.sizeBB)}BB`;
  }
}

function freqPhrase(freq: number, actionLabel: string): string {
  if (freq >= 0.99) return `é ${actionLabel} puro (100%)`;
  if (freq <= 0.01) return `é fold puro (0% ${actionLabel})`;
  return `joga ${actionLabel} ${Math.round(freq * 100)}% das vezes`;
}

function pctFmt(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function roundBB(v: number): number {
  return Math.round(v * 2) / 2;
}
