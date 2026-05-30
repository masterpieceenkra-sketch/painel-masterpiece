"use client";

import type { ActionKind } from "@/domain/cards";
import type { Attempt, EvBucket, TopicProgress } from "@/domain/progress";
import { loadProgress } from "./localProgress";

const KEY_PREFIX = "ptr:v1:";
const EXPORT_VERSION = 1;

const VALID_BUCKETS: ReadonlySet<EvBucket> = new Set(["perfect", "minor", "medium", "major"]);
const VALID_KINDS: ReadonlySet<ActionKind> = new Set([
  "fold",
  "call",
  "raise",
  "jam",
  "check",
]);

export type ExportPayload = {
  version: number;
  exportedAt: string;
  topics: Record<string, TopicProgress>;
};

export function exportAll(topicIds: string[]): ExportPayload {
  const topics: Record<string, TopicProgress> = {};
  for (const id of topicIds) {
    const p = loadProgress(id);
    if (p.attempts.length > 0) topics[id] = p;
  }
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    topics,
  };
}

function isValidAction(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== "string" || !VALID_KINDS.has(v.kind as ActionKind)) return false;
  if (v.kind === "raise" && typeof v.sizeBB !== "number") return false;
  return true;
}

function isValidAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.spotId === "string" &&
    typeof v.hand === "string" &&
    typeof v.correct === "boolean" &&
    typeof v.evLossBB === "number" &&
    Number.isFinite(v.evLossBB) &&
    typeof v.timestampMs === "number" &&
    Number.isFinite(v.timestampMs) &&
    typeof v.bucket === "string" &&
    VALID_BUCKETS.has(v.bucket as EvBucket) &&
    isValidAction(v.chosen)
  );
}

export function importAll(payload: unknown): { imported: number; errors: string[] } {
  const errors: string[] = [];
  if (
    !payload ||
    typeof payload !== "object" ||
    !("topics" in payload) ||
    typeof (payload as ExportPayload).topics !== "object" ||
    (payload as ExportPayload).topics === null
  ) {
    return { imported: 0, errors: ["Payload inválido"] };
  }
  const data = payload as ExportPayload;
  if (data.version !== EXPORT_VERSION) {
    errors.push(`Versão ${data.version} pode ser incompatível (esperada ${EXPORT_VERSION})`);
  }
  let imported = 0;
  for (const [topicId, progress] of Object.entries(data.topics)) {
    if (!progress || typeof progress !== "object" || !Array.isArray(progress.attempts)) {
      errors.push(`Tópico ${topicId}: formato inválido`);
      continue;
    }
    const validAttempts = progress.attempts.filter(isValidAttempt);
    const dropped = progress.attempts.length - validAttempts.length;
    if (dropped > 0) {
      errors.push(`Tópico ${topicId}: ${dropped} tentativa(s) com formato inválido descartada(s)`);
    }
    if (validAttempts.length === 0) {
      continue;
    }
    const sanitized: TopicProgress = { topicId, attempts: validAttempts };
    try {
      window.localStorage.setItem(KEY_PREFIX + topicId, JSON.stringify(sanitized));
      imported++;
    } catch (e) {
      errors.push(`Tópico ${topicId}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  return { imported, errors };
}
