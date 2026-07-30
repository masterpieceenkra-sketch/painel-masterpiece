"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lesson } from "@/domain/course";
import { PASS_SCORE_PCT } from "@/domain/course";
import { LessonBlockView } from "@/components/learn/LessonBlocks";
import { saveQuizResult } from "@/storage/courseProgress";
import { cn } from "@/lib/cn";

export function LessonView({
  lesson,
  nextLesson,
}: {
  lesson: Lesson;
  nextLesson: { slug: string; title: string } | null;
}) {
  // answers[i] = índice escolhido na questão i (ou null se ainda não respondeu)
  const [answers, setAnswers] = useState<(number | null)[]>(
    lesson.quiz.map(() => null),
  );
  const [saved, setSaved] = useState(false);

  const answeredCount = answers.filter((a) => a != null).length;
  const allAnswered = answeredCount === lesson.quiz.length;
  const correctCount = answers.filter(
    (a, i) => a != null && a === lesson.quiz[i].correct,
  ).length;
  const scorePct = (correctCount / lesson.quiz.length) * 100;
  const passed = scorePct >= PASS_SCORE_PCT;

  function answer(qIdx: number, optIdx: number) {
    if (answers[qIdx] != null) return; // resposta é definitiva
    const next = answers.map((a, i) => (i === qIdx ? optIdx : a));
    setAnswers(next);
    // Última resposta → grava o resultado
    if (next.every((a) => a != null)) {
      const correct = next.filter((a, i) => a === lesson.quiz[i].correct).length;
      saveQuizResult(lesson.slug, (correct / lesson.quiz.length) * 100);
      setSaved(true);
    }
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setSaved(false);
  }

  return (
    <div className="space-y-8">
      {/* ── Instrução + demonstração ── */}
      <section className="max-w-3xl space-y-4">
        {lesson.blocks.map((block, i) => (
          <LessonBlockView key={i} block={block} />
        ))}
      </section>

      {/* ── Quiz ── */}
      <section className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            ✍️ Teste seu conhecimento
          </h2>
          <span className="text-xs text-slate-400">
            {answeredCount}/{lesson.quiz.length} respondidas
          </span>
        </div>

        {lesson.quiz.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <div
              key={qi}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <p className="text-sm font-medium text-slate-200">
                {qi + 1}. {q.q}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = q.correct === oi;
                  const revealed = chosen != null;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => answer(qi, oi)}
                      disabled={revealed}
                      className={cn(
                        "block w-full rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400",
                        !revealed &&
                          "border-slate-700 text-slate-300 hover:border-emerald-600 hover:bg-emerald-950/20",
                        revealed && isCorrect &&
                          "border-emerald-600 bg-emerald-950/40 text-emerald-200",
                        revealed && isChosen && !isCorrect &&
                          "border-rose-700 bg-rose-950/40 text-rose-200",
                        revealed && !isChosen && !isCorrect &&
                          "border-slate-800 text-slate-500",
                      )}
                    >
                      {revealed && isCorrect && <span aria-hidden="true">✓ </span>}
                      {revealed && isChosen && !isCorrect && <span aria-hidden="true">✗ </span>}
                      {opt}
                    </button>
                  );
                })}
              </div>
              {chosen != null && (
                <p
                  className={cn(
                    "mt-3 rounded-lg border p-3 text-xs leading-relaxed",
                    chosen === q.correct
                      ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-100"
                      : "border-amber-800/60 bg-amber-950/30 text-amber-100",
                  )}
                >
                  {q.explain}
                </p>
              )}
            </div>
          );
        })}

        {/* ── Resultado ── */}
        {allAnswered && (
          <div
            className={cn(
              "rounded-xl border p-5 text-center",
              passed
                ? "border-emerald-700 bg-emerald-950/40"
                : "border-amber-700 bg-amber-950/30",
            )}
            role="status"
          >
            <p className="text-2xl">{passed ? "🎉" : "📚"}</p>
            <p className="mt-1 text-base font-semibold text-white">
              {correctCount}/{lesson.quiz.length} corretas ({Math.round(scorePct)}%)
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {passed
                ? "Lição concluída! Agora leve o conceito para a prática."
                : `Você precisa de ${PASS_SCORE_PCT}% para concluir. Releia a lição e tente de novo — as explicações acima mostram onde escorregou.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {!passed && (
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-slate-950 outline-none transition-colors hover:bg-amber-500 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Tentar de novo
                </button>
              )}
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
            {saved && (
              <p className="mt-3 text-[11px] text-slate-500">
                Resultado salvo no seu progresso.
              </p>
            )}
          </div>
        )}

        {/* Prática visível também antes do quiz completo */}
        {!allAnswered && lesson.practice && (
          <p className="text-xs text-slate-500">
            Depois do quiz:{" "}
            <span className="text-slate-400">{lesson.practice.label}</span>
          </p>
        )}
      </section>
    </div>
  );
}
