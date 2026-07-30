import type { Action, HandCode } from "./cards";

export type EvBucket = "perfect" | "minor" | "medium" | "major";

export type Attempt = {
  spotId: string;
  hand: HandCode;
  chosen: Action;
  correct: boolean;
  evLossBB: number;
  bucket: EvBucket;
  timestampMs: number;
};

export type TopicProgress = {
  topicId: string;
  attempts: Attempt[];
};

export function summarize(progress: TopicProgress): {
  total: number;
  correctPct: number;
  avgEvLossBB: number;
  lastSeenMs: number | null;
} {
  const total = progress.attempts.length;
  if (total === 0) {
    return { total: 0, correctPct: 0, avgEvLossBB: 0, lastSeenMs: null };
  }
  const correct = progress.attempts.filter((a) => a.correct).length;
  const evSum = progress.attempts.reduce((acc, a) => acc + a.evLossBB, 0);
  const lastSeen = Math.max(...progress.attempts.map((a) => a.timestampMs));
  return {
    total,
    correctPct: (correct / total) * 100,
    avgEvLossBB: evSum / total,
    lastSeenMs: lastSeen,
  };
}
