"use client";

import { useState } from "react";
import type { QuizQuestion, QuizScene } from "@/domain/course";
import { Card } from "@/components/Card";
import { parseCardString } from "@/engine/handAnalyzer";
import { cn } from "@/lib/cn";
import type { Card as CardType } from "@/domain/cards";

/**
 * Quiz em formato de mesa de poker: uma pergunta por vez, cena de jogo no
 * feltro (board, mãos, pote) e opções como botões de ação. Chama onFinished
 * com o total de acertos quando a última pergunta é respondida.
 */

function cards(strings: string[] | undefined): CardType[] {
  return (strings ?? [])
    .map((s) => parseCardString(s))
    .filter((c): c is CardType => c != null);
}

function fmtBB(v: number): string {
  return Number.isInteger(v) ? `${v}` : v.toFixed(1);
}

function SceneView({ scene, qKey }: { scene: QuizScene | undefined; qKey: number }) {
  const board = cards(scene?.board);
  const hero = cards(scene?.hero);
  const villain = cards(scene?.villain);
  const hasCards = board.length > 0 || hero.length > 0 || villain.length > 0;
  const hasChips = scene?.potBB != null || scene?.betBB != null;

  return (
    <div
      className="rounded-2xl border border-emerald-900/60 p-4 sm:p-5"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at center, #065f46 0%, #064e3b 55%, #022c22 100%)",
      }}
    >
      {/* Vilão (topo) */}
      {villain.length > 0 && (
        <div className="mb-3 flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/70">
            {scene?.villainLabel ?? "Oponente"}
          </span>
          <div className="flex gap-1" key={`v-${qKey}`}>
            {villain.map((c, i) => (
              <Card
                key={i}
                card={c}
                size="sm"
                className="animate-deal-in"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Centro: pote + board */}
      <div className="flex flex-col items-center gap-2">
        {hasChips && (
          <div className="flex items-center gap-2">
            {scene?.potBB != null && (
              <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-xs text-amber-300">
                Pote: {fmtBB(scene.potBB)} BB
              </span>
            )}
            {scene?.betBB != null && (
              <span className="animate-chip-grow rounded-full bg-amber-400/20 px-3 py-1 font-mono text-xs font-semibold text-amber-300 ring-1 ring-amber-400/50">
                Aposta: {fmtBB(scene.betBB)} BB
              </span>
            )}
          </div>
        )}
        {board.length > 0 ? (
          <div className="flex gap-1.5" key={`b-${qKey}`}>
            {board.map((c, i) => (
              <Card
                key={i}
                card={c}
                size="md"
                className="animate-deal-in"
                style={{ animationDelay: `${i * 110}ms` }}
              />
            ))}
          </div>
        ) : (
          !hasCards && (
            <p className="py-2 text-center text-3xl" aria-hidden="true">
              ♠️ ♥️ ♦️ ♣️
            </p>
          )
        )}
      </div>

      {/* Herói (embaixo) */}
      {hero.length > 0 && (
        <div className="mt-3 flex flex-col items-center gap-1">
          <div className="flex gap-1" key={`h-${qKey}`}>
            {hero.map((c, i) => (
              <Card
                key={i}
                card={c}
                size="md"
                className="animate-deal-in"
                style={{ animationDelay: `${200 + i * 110}ms` }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/70">
            {scene?.heroLabel ?? "Sua mão"}
          </span>
        </div>
      )}
    </div>
  );
}

export function QuizTable({
  quiz,
  onFinished,
}: {
  quiz: QuizQuestion[];
  onFinished: (correctCount: number) => void;
}) {
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);

  const q = quiz[qi];
  const isLast = qi === quiz.length - 1;

  function pick(oi: number) {
    if (answeredCurrent) return;
    setChosen(oi);
    setAnsweredCurrent(true);
    if (oi === q.correct) setCorrectCount((c) => c + 1);
  }

  function advance() {
    const finalCorrect = correctCount;
    if (isLast) {
      onFinished(finalCorrect);
      return;
    }
    setQi((i) => i + 1);
    setChosen(null);
    setAnsweredCurrent(false);
  }

  const gotIt = chosen === q.correct;

  return (
    <div className="space-y-4">
      {/* Progresso: fichas por pergunta */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          Mão {qi + 1} de {quiz.length}
        </span>
        <div className="flex gap-1.5" aria-hidden="true">
          {quiz.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-full border transition-colors",
                i < qi
                  ? "border-emerald-500 bg-emerald-500"
                  : i === qi
                    ? "border-amber-400 bg-amber-400/40"
                    : "border-slate-700 bg-slate-800",
              )}
            />
          ))}
        </div>
      </div>

      {/* Mesa */}
      <SceneView scene={q.scene} qKey={qi} />

      {/* Pergunta */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm font-medium leading-relaxed text-slate-100">{q.q}</p>
      </div>

      {/* Opções como botões de ação */}
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Opções de resposta">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct;
          const isChosen = oi === chosen;
          return (
            <button
              key={oi}
              type="button"
              onClick={() => pick(oi)}
              disabled={answeredCurrent}
              className={cn(
                "min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                !answeredCurrent &&
                  "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-500 hover:bg-emerald-950/30 active:bg-emerald-950/50",
                answeredCurrent && isCorrect &&
                  "animate-chip-grow border-emerald-500 bg-emerald-950/50 text-emerald-100",
                answeredCurrent && isChosen && !isCorrect &&
                  "border-rose-600 bg-rose-950/40 text-rose-200",
                answeredCurrent && !isChosen && !isCorrect &&
                  "border-slate-800 bg-slate-900/40 text-slate-500",
              )}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                {answeredCurrent && isCorrect
                  ? "✓"
                  : answeredCurrent && isChosen && !isCorrect
                    ? "✗"
                    : String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback + avançar */}
      {answeredCurrent && (
        <div
          className={cn(
            "animate-fade-up rounded-xl border p-4",
            gotIt
              ? "border-emerald-700 bg-emerald-950/40"
              : "border-amber-700 bg-amber-950/30",
          )}
          role="status"
        >
          <p className="text-sm font-semibold text-white">
            {gotIt ? "🏆 Você levou o pote!" : "💸 Essa custou fichas…"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{q.explain}</p>
          <button
            type="button"
            onClick={advance}
            className="mt-3 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {isLast ? "Ver resultado final →" : "Próxima mão →"}
          </button>
        </div>
      )}
    </div>
  );
}
