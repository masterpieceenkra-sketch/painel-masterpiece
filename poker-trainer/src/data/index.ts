import type { ActionKind } from "@/domain/cards";
import type { FrequencyMix, PreflopRange, RangeSource } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import type { Topic } from "@/domain/topics";
import { expandTokens } from "@/engine/rangeCompiler";
import topicsJson from "./topics.json";
import spotsJson from "./spots.json";
import nash10bbSbJam from "./ranges/nash-10bb-sb-jam.json";
import nash15bbCoJam from "./ranges/nash-15bb-co-jam.json";
import nash12bbBbCall from "./ranges/nash-12bb-bb-call.json";
import openBtn25bb from "./ranges/open-btn-25bb.json";
import openHj40bb from "./ranges/open-hj-40bb.json";
import openUtg30bb from "./ranges/open-utg-30bb.json";
import defBbVsBtn25bb from "./ranges/def-bb-vs-btn-25bb.json";

export const TOPICS: Topic[] = topicsJson as Topic[];
export const SPOTS: PreflopSpot[] = spotsJson as PreflopSpot[];

const RANGE_SOURCES: RangeSource[] = [
  nash10bbSbJam,
  nash15bbCoJam,
  nash12bbBbCall,
  openBtn25bb,
  openHj40bb,
  openUtg30bb,
  defBbVsBtn25bb,
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

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getSpot(id: string): PreflopSpot | undefined {
  return SPOTS.find((s) => s.id === id);
}

export function getRange(id: string): PreflopRange | undefined {
  return RANGES[id];
}

export function listTopics(): Topic[] {
  return TOPICS;
}

export function listRanges(): PreflopRange[] {
  return Object.values(RANGES);
}
