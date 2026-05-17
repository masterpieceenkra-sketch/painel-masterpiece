import type { ActionKind, Card, Position, Rank, Suit } from "@/domain/cards";
import type { PostflopSpot } from "@/domain/postflop";
import type { FrequencyMix, PreflopRange, RangeSource } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import type { Topic } from "@/domain/topics";
import { expandTokens } from "@/engine/rangeCompiler";
import topicsJson from "./topics.json";
import spotsJson from "./spots.json";
import nash10bbSbJam from "./ranges/nash-10bb-sb-jam.json";
import nash15bbCoJam from "./ranges/nash-15bb-co-jam.json";
import nash12bbBbCall from "./ranges/nash-12bb-bb-call.json";
import nash7bbBtnJam from "./ranges/nash-7bb-btn-jam.json";
import nash10bbBtnJam from "./ranges/nash-10bb-btn-jam.json";
import nash15bbBtnJam from "./ranges/nash-15bb-btn-jam.json";
import nash10bbCoJam from "./ranges/nash-10bb-co-jam.json";
import nash15bbSbJam from "./ranges/nash-15bb-sb-jam.json";
import nash20bbSbJam from "./ranges/nash-20bb-sb-jam.json";
import nash10bbBbCallBtn from "./ranges/nash-10bb-bb-call-btn.json";
import openBtn25bb from "./ranges/open-btn-25bb.json";
import openBtn50bb from "./ranges/open-btn-50bb.json";
import openHj25bb from "./ranges/open-hj-25bb.json";
import openHj40bb from "./ranges/open-hj-40bb.json";
import openCo25bb from "./ranges/open-co-25bb.json";
import openUtg30bb from "./ranges/open-utg-30bb.json";
import defBbVsBtn25bb from "./ranges/def-bb-vs-btn-25bb.json";
import threeBetBbVsCo50bb from "./ranges/3bet-bb-vs-co-50bb.json";
import threeBetSbVsBtn25bb from "./ranges/3bet-sb-vs-btn-25bb.json";
import icmBubbleSbJam15bb from "./ranges/icm-bubble-sb-jam-15bb.json";
import icmBubbleBbCallSbJam15bb from "./ranges/icm-bubble-bb-call-sb-jam-15bb.json";
import icmFtCoJam10bb from "./ranges/icm-ft-co-jam-10bb.json";
import srpBtnVsBbAxx from "./postflop/srp-btn-vs-bb-axx.json";

export const TOPICS: Topic[] = topicsJson as Topic[];
export const SPOTS: PreflopSpot[] = spotsJson as PreflopSpot[];

const RANGE_SOURCES: RangeSource[] = [
  nash10bbSbJam,
  nash15bbCoJam,
  nash12bbBbCall,
  nash7bbBtnJam,
  nash10bbBtnJam,
  nash15bbBtnJam,
  nash10bbCoJam,
  nash15bbSbJam,
  nash20bbSbJam,
  nash10bbBbCallBtn,
  openBtn25bb,
  openBtn50bb,
  openHj25bb,
  openHj40bb,
  openCo25bb,
  openUtg30bb,
  defBbVsBtn25bb,
  threeBetBbVsCo50bb,
  threeBetSbVsBtn25bb,
  icmBubbleSbJam15bb,
  icmBubbleBbCallSbJam15bb,
  icmFtCoJam10bb,
] as RangeSource[];

function compile(source: RangeSource): PreflopRange {
  const cells: Record<string, FrequencyMix> = {};

  if (source.compactCells) {
    for (const [action, tokens] of Object.entries(source.compactCells)) {
      if (!tokens) continue;
      const hands = expandTokens(tokens);
      for (const hand of hands) {
        cells[hand] = { ...(cells[hand] ?? {}), [action as ActionKind]: 1 };
      }
    }
  }

  if (source.cells) {
    for (const [hand, mix] of Object.entries(source.cells)) {
      cells[hand] = { ...mix };
    }
  }

  return {
    id: source.id,
    label: source.label,
    description: source.description,
    effectiveBB: source.effectiveBB,
    sourceNote: source.sourceNote,
    defaultFrequencies: source.defaultFrequencies,
    cells,
  };
}

const RANGES: Record<string, PreflopRange> = Object.fromEntries(
  RANGE_SOURCES.map((src) => [src.id, compile(src)]),
);

function parseCard(s: string): Card {
  return { rank: s[0] as Rank, suit: s[1] as Suit };
}

function compilePostflopSpot(raw: {
  id: string;
  street: "flop" | "turn" | "river";
  board: string[];
  preflop: { heroPos: string; villainPos: string; openSizeBB: number };
  heroHand: string[];
  heroStackBB: number;
  potBB: number;
  villainRangeLabel: string;
  solution: {
    actions: { action: { kind: string; sizeBB?: number }; frequency: number; evBB: number }[];
    bestAction: { kind: string; sizeBB?: number };
    explanation_ptBR: string;
    sourceNote: string;
  };
}): PostflopSpot {
  const legalActions = [
    { kind: "check" } as const,
    ...raw.solution.actions
      .filter((a) => a.action.kind === "raise")
      .map((a) => ({ kind: "raise" as const, sizeBB: a.action.sizeBB ?? 0 })),
  ];
  return {
    kind: "postflop",
    id: raw.id,
    street: raw.street,
    board: raw.board.map(parseCard),
    preflop: {
      heroPos: raw.preflop.heroPos as PostflopSpot["preflop"]["heroPos"],
      villainPos: raw.preflop.villainPos as PostflopSpot["preflop"]["villainPos"],
      openSizeBB: raw.preflop.openSizeBB,
    },
    heroHand: [parseCard(raw.heroHand[0]), parseCard(raw.heroHand[1])],
    heroStackBB: raw.heroStackBB,
    potBB: raw.potBB,
    villainRangeLabel: raw.villainRangeLabel,
    legalActions,
    solution: {
      actions: raw.solution.actions.map((a) => ({
        action:
          a.action.kind === "raise"
            ? { kind: "raise", sizeBB: a.action.sizeBB ?? 0 }
            : (a.action as PostflopSpot["solution"]["actions"][number]["action"]),
        frequency: a.frequency,
        evBB: a.evBB,
      })),
      bestAction:
        raw.solution.bestAction.kind === "raise"
          ? { kind: "raise", sizeBB: raw.solution.bestAction.sizeBB ?? 0 }
          : (raw.solution.bestAction as PostflopSpot["solution"]["bestAction"]),
      explanation_ptBR: raw.solution.explanation_ptBR,
      sourceNote: raw.solution.sourceNote,
    },
  };
}

const POSTFLOP_SETS: Record<string, PostflopSpot[]> = {
  [srpBtnVsBbAxx.topicId]: (srpBtnVsBbAxx.spots as Parameters<typeof compilePostflopSpot>[0][]).map(
    compilePostflopSpot,
  ),
};

export type ActionNode =
  | "push-fold-jam"
  | "push-fold-call"
  | "open"
  | "3bet"
  | "postflop"
  | "icm";

export const ACTION_NODE_LABEL: Record<ActionNode, string> = {
  "push-fold-jam": "Push/Fold — Jam",
  "push-fold-call": "Push/Fold — Call",
  open: "Open RFI",
  "3bet": "3-bet vs Open",
  postflop: "Pós-flop",
  icm: "ICM (bolha + FT)",
};

export type TopicMatrixEntry = {
  topic: Topic;
  node: ActionNode;
  heroPos: Position | "ANY";
  effectiveBB: number | null;
};

export function topicMatrixEntry(topic: Topic): TopicMatrixEntry | null {
  if (topic.drillType === "postflop") {
    return { topic, node: "postflop", heroPos: "ANY", effectiveBB: null };
  }
  const spot = getSpot(topic.spotIds[0]);
  if (!spot) return null;
  if (spot.kind === "pushfold") {
    if (spot.icmContext !== "chipEV") {
      return { topic, node: "icm", heroPos: spot.heroPos, effectiveBB: spot.effectiveBB };
    }
    return {
      topic,
      node: spot.heroRole === "caller" ? "push-fold-call" : "push-fold-jam",
      heroPos: spot.heroPos,
      effectiveBB: spot.effectiveBB,
    };
  }
  if (spot.kind === "open") {
    return { topic, node: "open", heroPos: spot.heroPos, effectiveBB: spot.effectiveBB };
  }
  return { topic, node: "3bet", heroPos: spot.heroPos, effectiveBB: spot.effectiveBB };
}

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getSpot(id: string): PreflopSpot | undefined {
  return SPOTS.find((s) => s.id === id);
}

export function getRange(id: string): PreflopRange | undefined {
  return RANGES[id];
}

export function getPostflopSpots(topicId: string): PostflopSpot[] | undefined {
  return POSTFLOP_SETS[topicId];
}

export function listTopics(): Topic[] {
  return TOPICS;
}

export function listRanges(): PreflopRange[] {
  return Object.values(RANGES);
}
