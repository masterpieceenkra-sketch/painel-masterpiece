"use client";

import type { TopicProgress } from "@/domain/progress";
import { loadProgress } from "./localProgress";

const KEY_PREFIX = "ptr:v1:";
const EXPORT_VERSION = 1;

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

export function importAll(payload: unknown): { imported: number; errors: string[] } {
  const errors: string[] = [];
  if (
    !payload ||
    typeof payload !== "object" ||
    !("topics" in payload) ||
    typeof (payload as ExportPayload).topics !== "object"
  ) {
    return { imported: 0, errors: ["Payload inválido"] };
  }
  const data = payload as ExportPayload;
  if (data.version !== EXPORT_VERSION) {
    errors.push(`Versão ${data.version} pode ser incompatível (esperada ${EXPORT_VERSION})`);
  }
  let imported = 0;
  for (const [topicId, progress] of Object.entries(data.topics)) {
    if (!progress || !Array.isArray(progress.attempts)) {
      errors.push(`Tópico ${topicId}: formato inválido`);
      continue;
    }
    try {
      window.localStorage.setItem(KEY_PREFIX + topicId, JSON.stringify(progress));
      imported++;
    } catch (e) {
      errors.push(`Tópico ${topicId}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  return { imported, errors };
}
