"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lesson } from "@/domain/course";
import { PASS_SCORE_PCT } from "@/domain/course";
import { LessonBlockView } from "@/components/learn/LessonBlocks";
import { QuizTable } from "@/components/learn/QuizTable";
import { saveQuizResult } from "@/storage/courseProgress";
import { cn } from "@/lib/cn";

export function LessonView({
  lesson,
  nextLesson,
}: {
  lesson: Lesson;
  nextLesson: { slug: string; title: string } | null;
}) {
  // null = quiz em andamento; número = acertos na rodada finalizada.
  const [finishedCorrect, setFinishedCorrect] = useState<number | null>(null);
  // Incrementa para remontar o QuizTable numa nova tentativa.
  const [attempt, setAttempt] = useState(0);

  const total = lesson.quiz.length;
  const scorePct = finishedCorrect != null ? (finishedCorrect / total) * 100 : 0;
  const passed = scorePct >= PASS_SCORE_PCT;

  function handleFinished(correctCount: number) {
    setFinishedCorrect(correctCount);
    saveQuizResult(lesson.slug, (correctCount / total) * 100);
  }

  function retry() {
    setFinishedCorrect(null);
    setAttempt((a) => a + 1);
  }

  return (
    <div className="space-y-8">
      {/* ── Instrução + demonstração ── */}
      <section className="max-w-3xl space-y-4">
        {lesson.blocks.map((block, i) => (
          <LessonBlockView key={i} block={block} />
        ))}
      </section>

      {/* ── Quiz na mesa ── */}
      <section className="max-w-3xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">🃏 Hora de jogar</h2>
          <p className="mt-1 text-sm text-slate-400">
            {total} mãos na mesa. Leia a situação, escolha sua jogada — acerte{" "}
            {PASS_SCORE_PCT}% para concluir a lição.
          </p>
        </div>

        {finishedCorrect == null ? (
          <QuizTable key={attempt} quiz={lesson.quiz} onFinished={handleFinished} />
        ) : (
          <div
            className={cn(
              "rounded-xl border p-6 text-center",
              passed
                ? "border-emerald-700 bg-emerald-950/40"
                : "border-amber-700 bg-amber-950/30",
            )}
            role="status"
          >
            <p className="animate-chip-grow text-3xl">{passed ? "🏆" : "📚"}</p>
            <p className="mt-2 text-lg font-bold text-white">
              {finishedCorrect}/{total} potes ganhos ({Math.round(scorePct)}%)
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {passed
                ? "Lição concluída! Agora leve o conceito para a mesa de verdade."
                : `Você precisa de ${PASS_SCORE_PCT}% para concluir. Releia a lição e jogue de novo.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={retry}
                className={cn(
                  "rounded-md px-5 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2",
                  passed
                    ? "border border-slate-700 text-slate-300 hover:border-slate-500 focus-visible:ring-emerald-400"
                    : "bg-amber-600 text-slate-950 hover:bg-amber-500 focus-visible:ring-amber-400",
                )}
              >
                {passed ? "Jogar de novo" : "Tentar de novo"}
              </button>
              {passed && lesson.practice && (
                <Link
                  href={lesson.practice.href}
                  className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  🎯 Praticar agora
                </Link>
              )}
              {passed && nextLesson && (
                <Link
                  href={`/aprender/${nextLesson.slug}`}
                  className="rounded-md border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-300 outline-none transition-colors hover:bg-emerald-950/40 focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Próxima lição: {nextLesson.title} →
                </Link>
              )}
              {passed && !nextLesson && (
                <Link
                  href="/aprender"
                  className="rounded-md border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-300 outline-none transition-colors hover:bg-emerald-950/40 focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  🎓 Você terminou o curso — ver trilha completa
                </Link>
              )}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Resultado salvo no seu progresso.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
