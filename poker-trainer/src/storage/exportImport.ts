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

export type ImportMode = "merge" | "replace";

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

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isValidAction(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== "string" || !VALID_KINDS.has(v.kind as ActionKind)) return false;
  if (v.kind === "raise" && !isFiniteNumber(v.sizeBB)) return false;
  return true;
}

function isValidAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.spotId === "string" &&
    typeof v.hand === "string" &&
    typeof v.correct === "boolean" &&
    isFiniteNumber(v.evLossBB) &&
    isFiniteNumber(v.timestampMs) &&
    typeof v.bucket === "string" &&
    VALID_BUCKETS.has(v.bucket as EvBucket) &&
    isValidAction(v.chosen)
  );
}

function attemptKey(a: Attempt): string {
  return `${a.timestampMs}:${a.spotId}:${a.hand}`;
}

function mergeAttempts(existing: Attempt[], incoming: Attempt[]): Attempt[] {
  const seen = new Set(existing.map(attemptKey));
  const out = [...existing];
  for (const a of incoming) {
    const k = attemptKey(a);
    if (!seen.has(k)) {
      out.push(a);
      seen.add(k);
    }
  }
  out.sort((a, b) => a.timestampMs - b.timestampMs);
  return out;
}

export function importAll(
  payload: unknown,
  mode: ImportMode = "merge",
): { imported: number; merged: number; replaced: number; errors: string[] } {
  const errors: string[] = [];
  if (
    !payload ||
    typeof payload !== "object" ||
    !("topics" in payload) ||
    typeof (payload as ExportPayload).topics !== "object" ||
    (payload as ExportPayload).topics === null
  ) {
    return { imported: 0, merged: 0, replaced: 0, errors: ["Payload inválido"] };
  }
  const data = payload as ExportPayload;
  if (data.version !== EXPORT_VERSION) {
    errors.push(`Versão ${data.version} pode ser incompatível (esperada ${EXPORT_VERSION})`);
  }
  let imported = 0;
  let merged = 0;
  let replaced = 0;
  for (const [topicId, progress] of Object.entries(data.topics)) {
    if (!progress || typeof progress !== "object" || !Array.isArray(progress.attempts)) {
      errors.push(`Tópico ${topicId}: formato inválido`);
      continue;
    }
    const validAttempts = progress.attempts.filter(isValidAttempt);
    const dropped = progress.attempts.length - validAttempts.length;
    if (dropped > 0) {
      errors.push(
        `Tópico ${topicId}: ${dropped} tentativa(s) com formato inválido descartada(s) ` +
          `(checa: campos spotId/hand/correct/evLossBB/timestampMs/bucket e chosen.kind/sizeBB)`,
      );
    }
    if (validAttempts.length === 0) continue;

    let finalAttempts: Attempt[];
    if (mode === "replace") {
      finalAttempts = validAttempts.slice().sort((a, b) => a.timestampMs - b.timestampMs);
      replaced++;
    } else {
      const existing = loadProgress(topicId);
      finalAttempts = mergeAttempts(existing.attempts, validAttempts);
      merged++;
    }
    const sanitized: TopicProgress = { topicId, attempts: finalAttempts };
    try {
      window.localStorage.setItem(KEY_PREFIX + topicId, JSON.stringify(sanitized));
      imported++;
    } catch (e) {
      errors.push(`Tópico ${topicId}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  return { imported, merged, replaced, errors };
}
