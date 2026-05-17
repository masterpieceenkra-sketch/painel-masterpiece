import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import type { Topic } from "@/domain/topics";
import topicsJson from "./topics.json";
import spotsJson from "./spots.json";
import nash10bbSbJam from "./ranges/nash-10bb-sb-jam.json";

export const TOPICS: Topic[] = topicsJson as Topic[];
export const SPOTS: PreflopSpot[] = spotsJson as PreflopSpot[];

const RANGES: Record<string, PreflopRange> = {
  "nash-10bb-sb-jam": nash10bbSbJam as PreflopRange,
};

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
