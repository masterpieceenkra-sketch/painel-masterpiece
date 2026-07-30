"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COURSE, allLessons } from "@/data/course";
import type { CourseLevel } from "@/domain/course";
import {
  isLessonComplete,
  loadCourseProgress,
  type CourseProgress,
} from "@/storage/courseProgress";
import { cn } from "@/lib/cn";

const LEVEL_STYLE: Record<CourseLevel, string> = {
  básico: "border-emerald-700/60 bg-emerald-950/40 text-emerald-300",
  intermediário: "border-sky-700/60 bg-sky-950/40 text-sky-300",
  avançado: "border-amber-700/60 bg-amber-950/40 text-amber-300",
};

export function CourseOverview() {
  // Progresso vem do localStorage — hidrata no cliente para evitar mismatch.
  const [progress, setProgress] = useState<CourseProgress>({});
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setProgress(loadCourseProgress());
    setHydrated(true);
  }, []);

  const lessons = allLessons();
  const completedCount = lessons.filter((l) => isLessonComplete(progress, l.slug)).length;
  const firstIncomplete = lessons.find((l) => !isLessonComplete(progress, l.slug));

  return (
    <div className="space-y-6">
      {/* Barra geral de progresso + continuar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="min-w-48 flex-1">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">{completedCount}</span> de{" "}
            {lessons.length} lições concluídas
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={lessons.length}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(completedCount / lessons.length) * 100}%` }}
            />
          </div>
        </div>
        {hydrated && firstIncomplete && (
          <Link
            href={`/aprender/${firstIncomplete.slug}`}
            className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {completedCount === 0 ? "Começar o curso →" : "Continuar →"}
          </Link>
        )}
        {hydrated && !firstIncomplete && (
          <span className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-300">
            🎓 Curso completo!
          </span>
        )}
      </div>

      {/* Módulos */}
      {COURSE.map((mod, mi) => (
        <section key={mod.id}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Módulo {mi + 1} — {mod.title}
            </h2>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                LEVEL_STYLE[mod.level],
              )}
            >
              {mod.level}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{mod.description}</p>

          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {mod.lessons.map((lesson) => {
              const done = isLessonComplete(progress, lesson.slug);
              const score = progress[lesson.slug]?.bestScorePct;
              return (
                <li key={lesson.slug}>
                  <Link
                    href={`/aprender/${lesson.slug}`}
                    className={cn(
                      "flex h-full flex-col rounded-xl border p-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400",
                      done
                        ? "border-emerald-800/70 bg-emerald-950/25 hover:border-emerald-600"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{lesson.title}</p>
                      <span aria-hidden="true" className="text-base">
                        {done ? "✅" : "📖"}
                      </span>
                    </div>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-400">
                      {lesson.summary}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      ~{lesson.minutes} min · quiz de {lesson.quiz.length} questões
                      {done && score != null && (
                        <span className="ml-1.5 text-emerald-400">
                          · melhor nota {Math.round(score)}%
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
