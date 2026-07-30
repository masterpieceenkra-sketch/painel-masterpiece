"use client";

import { PASS_SCORE_PCT } from "@/domain/course";

const KEY = "ptr:curso:v1";

export type LessonProgress = {
  bestScorePct: number;
  completedAt: number | null;
  attempts: number;
};

export type CourseProgress = Record<string, LessonProgress>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCourseProgress(): CourseProgress {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CourseProgress;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveQuizResult(slug: string, scorePct: number): CourseProgress {
  const current = loadCourseProgress();
  const prev = current[slug];
  const best = Math.max(prev?.bestScorePct ?? 0, scorePct);
  const next: CourseProgress = {
    ...current,
    [slug]: {
      bestScorePct: best,
      completedAt:
        prev?.completedAt ?? (scorePct >= PASS_SCORE_PCT ? Date.now() : null),
      attempts: (prev?.attempts ?? 0) + 1,
    },
  };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}

export function isLessonComplete(progress: CourseProgress, slug: string): boolean {
  return progress[slug]?.completedAt != null;
}
