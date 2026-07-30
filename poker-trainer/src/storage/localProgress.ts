"use client";

import type { Attempt, TopicProgress } from "@/domain/progress";

const KEY_PREFIX = "ptr:v1:";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadProgress(topicId: string): TopicProgress {
  if (!isBrowser()) return { topicId, attempts: [] };
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + topicId);
    if (!raw) return { topicId, attempts: [] };
    const parsed = JSON.parse(raw) as TopicProgress;
    if (!parsed || !Array.isArray(parsed.attempts)) return { topicId, attempts: [] };
    return parsed;
  } catch {
    return { topicId, attempts: [] };
  }
}

export function saveAttempt(topicId: string, attempt: Attempt): TopicProgress {
  const current = loadProgress(topicId);
  const next: TopicProgress = {
    topicId,
    attempts: [...current.attempts, attempt],
  };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY_PREFIX + topicId, JSON.stringify(next));
    } catch {}
  }
  return next;
}

export function resetProgress(topicId: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY_PREFIX + topicId);
  } catch {}
}
