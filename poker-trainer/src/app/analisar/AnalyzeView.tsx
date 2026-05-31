"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import type { Action, Card as CardModel, Position } from "@/domain/cards";
import { POSITION_LABEL_PT } from "@/domain/cards";
import type { PostflopSpot } from "@/domain/postflop";
import type { PreflopRange } from "@/domain/range";
import type { PreflopSpot } from "@/domain/spots";
import {
  analyzeHand,
  parseCardString,
  type AnalyzedStep,
  type GameFormat,
  type HandAnalysis,
  type HandInput,
  type StreetAction,
} from "@/engine/handAnalyzer";
import { cn } from "@/lib/cn";
import { formatBB } from "@/lib/format";

type Props = {
  spots: PreflopSpot[];
  ranges: PreflopRange[];
  postflopSpots: PostflopSpot[];
  topicsByRange: Record<string, string>;
};

const POS_6MAX: Position[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const ACTION_KINDS = ["fold", "call", "check", "raise", "jam"] as const;

type FormState = {
  format: GameFormat;
  effectiveBB: string; // string for input control
  heroPos: Position;
  villainPos: Position;
  heroCardA: string;
  heroCardB: string;
  preflopActions: StreetAction[];
  hasFlop: boolean;
  flopA: string;
  flopB: string;
  flopC: string;
  flopActions: StreetAction[];
  hasTurn: boolean;
  turnCard: string;
  turnActions: StreetAction[];
  hasRiver: boolean;
  riverCard: string;
  riverActions: StreetAction[];
};

const INITIAL: FormState = {
  format: "mtt",
  effectiveBB: "30",
  heroPos: "BTN",
  villainPos: "BB",
  heroCardA: "",
  heroCardB: "",
  preflopActions: [],
  hasFlop: false,
  flopA: "",
  flopB: "",
  flopC: "",
  flopActions: [],
  hasTurn: false,
  turnCard: "",
  turnActions: [],
  hasRiver: false,
  riverCard: "",
  riverActions: [],
};

export function AnalyzeView({ spots, ranges, postflopSpots, topicsByRange }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const topicsByRangeMap = useMemo(() => new Map(Object.entries(topicsByRange)), [topicsByRange]);

  function handleAnalyze() {
    setValidationError(null);
    const input = buildInput(form);
    if (typeof input === "string") {
      setValidationError(input);
      setAnalysis(null);
      return;
    }
    const result = analyzeHand(input, {
      spots,
      ranges,
      postflopSpots,
      topicsByRange: topicsByRangeMap,
    });
    setAnalysis(result);
    // Scroll into view on next tick — using anchor approach
    setTimeout(() => {
      document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleReset() {
    setForm(INITIAL);
    setAnalysis(null);
    setValidationError(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
        <Section title="1. Tipo de jogo">
          <SegmentedControl
            value={form.format}
            onChange={(v) => setForm({ ...form, format: v })}
            options={[
              { value: "mtt", label: "MTT" },
              { value: "cash", label: "Cash" },
            ]}
          />
          <div className="flex items-baseline gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Stack effective
            </label>
            <input
              type="number"
              min={2}
              max={500}
              value={form.effectiveBB}
              onChange={(e) => setForm({ ...form, effectiveBB: e.target.value })}
              className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500">BB</span>
          </div>
        </Section>

        <Section title="2. Posições">
          <PositionPicker
            label="Sua posição (Hero)"
            value={form.heroPos}
            onChange={(p) => setForm({ ...form, heroPos: p })}
          />
          <PositionPicker
            label="Vilão"
            value={form.villainPos}
            onChange={(p) => setForm({ ...form, villainPos: p })}
          />
        </Section>

        <Section title="3. Suas cartas">
          <div className="flex items-center gap-2">
            <CardInput
              value={form.heroCardA}
              onChange={(v) => setForm({ ...form, heroCardA: v })}
              placeholder="Ah"
            />
            <CardInput
              value={form.heroCardB}
              onChange={(v) => setForm({ ...form, heroCardB: v })}
              placeholder="Ks"
            />
            <span className="ml-2 text-xs text-slate-500">
              Use rank + naipe: A K Q J T 9..2 + s/h/d/c (ex.: <code className="text-slate-300">Ah</code>, <code className="text-slate-300">Td</code>)
            </span>
          </div>
        </Section>

        <Section title="4. Ações pré-flop">
          <ActionList
            actions={form.preflopActions}
            onChange={(a) => setForm({ ...form, preflopActions: a })}
            allowSize
          />
        </Section>

        <Section title="5. Flop (opcional)">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.hasFlop}
              onChange={(e) => setForm({ ...form, hasFlop: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
            Houve flop
          </label>
          {form.hasFlop && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <CardInput value={form.flopA} onChange={(v) => setForm({ ...form, flopA: v })} placeholder="As" />
                <CardInput value={form.flopB} onChange={(v) => setForm({ ...form, flopB: v })} placeholder="7d" />
                <CardInput value={form.flopC} onChange={(v) => setForm({ ...form, flopC: v })} placeholder="2c" />
              </div>
              <ActionList
                actions={form.flopActions}
                onChange={(a) => setForm({ ...form, flopActions: a })}
                allowSize
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.hasTurn}
                  onChange={(e) => setForm({ ...form, hasTurn: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
                Houve turn
              </label>
              {form.hasTurn && (
                <>
                  <CardInput value={form.turnCard} onChange={(v) => setForm({ ...form, turnCard: v })} placeholder="Qh" />
                  <ActionList
                    actions={form.turnActions}
                    onChange={(a) => setForm({ ...form, turnActions: a })}
                    allowSize
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.hasRiver}
                      onChange={(e) => setForm({ ...form, hasRiver: e.target.checked })}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    Houve river
                  </label>
                  {form.hasRiver && (
                    <>
                      <CardInput value={form.riverCard} onChange={(v) => setForm({ ...form, riverCard: v })} placeholder="3d" />
                      <ActionList
                        actions={form.riverActions}
                        onChange={(a) => setForm({ ...form, riverActions: a })}
                        allowSize
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Section>

        {validationError && (
          <div className="rounded border border-rose-800 bg-rose-950/40 px-4 py-2 text-sm text-rose-300">
            {validationError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Analisar mão
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Limpar
          </button>
        </div>
      </div>

      {analysis && (
        <AnalysisResult analysis={analysis} />
      )}
    </div>
  );
}

/* ─────────── Pieces ─────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-9 rounded px-3 text-xs font-semibold transition-colors",
            value === o.value ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-slate-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PositionPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Position;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-1">
        {POS_6MAX.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "min-h-9 min-w-12 rounded border px-2 text-xs font-semibold transition-colors",
              value === p
                ? "border-emerald-500 bg-emerald-900/40 text-emerald-200"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
            )}
            title={POSITION_LABEL_PT[p]}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function CardInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parsed = value ? parseCardString(value) : null;
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={2}
        className={cn(
          "w-16 rounded border bg-slate-950 px-2 py-1 text-center font-mono text-sm uppercase text-white focus:outline-none",
          value && !parsed
            ? "border-rose-700 focus:border-rose-500"
            : "border-slate-700 focus:border-emerald-500",
        )}
      />
      {parsed && <Card card={parsed} size="sm" />}
    </div>
  );
}

function ActionList({
  actions,
  onChange,
  allowSize,
}: {
  actions: StreetAction[];
  onChange: (a: StreetAction[]) => void;
  allowSize: boolean;
}) {
  function addAction() {
    onChange([
      ...actions,
      { actor: "hero", action: { kind: "fold" } },
    ]);
  }
  function removeAction(i: number) {
    onChange(actions.filter((_, idx) => idx !== i));
  }
  function updateAction(i: number, next: StreetAction) {
    onChange(actions.map((a, idx) => (idx === i ? next : a)));
  }

  return (
    <div className="w-full space-y-2">
      {actions.length === 0 && (
        <p className="text-xs text-slate-500">Nenhuma ação adicionada ainda.</p>
      )}
      {actions.map((a, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-2 py-1.5"
        >
          <select
            value={a.actor}
            onChange={(e) =>
              updateAction(i, { ...a, actor: e.target.value as "hero" | "villain" })
            }
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          >
            <option value="hero">Hero</option>
            <option value="villain">Vilão</option>
          </select>
          <select
            value={a.action.kind}
            onChange={(e) => {
              const kind = e.target.value as (typeof ACTION_KINDS)[number];
              const next: Action =
                kind === "raise"
                  ? { kind: "raise", sizeBB: a.action.kind === "raise" ? a.action.sizeBB : 2.5 }
                  : { kind };
              updateAction(i, { ...a, action: next });
            }}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          >
            {ACTION_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          {allowSize && a.action.kind === "raise" && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                step={0.1}
                value={a.action.sizeBB}
                onChange={(e) =>
                  updateAction(i, {
                    ...a,
                    action: { kind: "raise", sizeBB: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right font-mono text-xs text-white focus:outline-none"
              />
              <span className="text-xs text-slate-500">BB</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => removeAction(i)}
            className="ml-auto rounded px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
            aria-label="Remover ação"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addAction}
        className="inline-flex min-h-9 items-center gap-1 rounded border border-dashed border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-emerald-700 hover:text-emerald-300"
      >
        + Adicionar ação
      </button>
    </div>
  );
}

function AnalysisResult({ analysis }: { analysis: HandAnalysis }) {
  const { steps, summary } = analysis;
  const totalTone =
    summary.totalEvLoss < 0.1
      ? "good"
      : summary.totalEvLoss < 0.5
        ? "warn"
        : "bad";
  const totalToneClass = {
    good: "text-emerald-300",
    warn: "text-amber-300",
    bad: "text-rose-300",
  }[totalTone];

  return (
    <div id="analysis-result" className="space-y-4 rounded-lg border border-emerald-900/40 bg-slate-950/80 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Análise</h2>
        <div className="text-sm text-slate-400">
          EV total perdido:{" "}
          <span className={cn("font-mono font-bold", totalToneClass)}>
            {formatBB(summary.totalEvLoss)}
          </span>
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((s, i) => (
          <StepRow key={i} step={s} isWorst={summary.worstStepIdx === i} />
        ))}
      </ol>

      {summary.suggestedTopicSlug && (
        <div className="rounded border border-emerald-900/40 bg-emerald-950/30 p-3 text-sm">
          <p className="text-emerald-200">
            Quer treinar esse tipo de spot?{" "}
            <Link
              href={`/treino/${summary.suggestedTopicSlug}`}
              className="font-semibold text-emerald-300 underline hover:text-emerald-200"
            >
              Abrir tópico relacionado →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function StepRow({ step, isWorst }: { step: AnalyzedStep; isWorst: boolean }) {
  const toneBorder = {
    good: "border-emerald-800/50",
    warn: "border-amber-800/50",
    bad: "border-rose-800/50",
    muted: "border-slate-800",
  }[step.tone];
  const toneBg = {
    good: "bg-emerald-950/20",
    warn: "bg-amber-950/20",
    bad: "bg-rose-950/20",
    muted: "bg-slate-900/40",
  }[step.tone];
  const streetLabel = step.street === "preflop" ? "PREFLOP" : step.street.toUpperCase();
  const verdictBadge =
    step.actor === "villain"
      ? null
      : step.verdict === "match"
        ? { label: "spot exato", className: "bg-emerald-900/50 text-emerald-300" }
        : step.verdict === "deviation"
          ? { label: "deviation", className: "bg-rose-900/50 text-rose-300" }
          : { label: "heurística", className: "bg-amber-900/50 text-amber-300" };

  return (
    <li
      className={cn(
        "rounded-lg border p-3",
        toneBorder,
        toneBg,
        isWorst && "ring-2 ring-rose-500/40",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {streetLabel}
          </span>
          <span className="text-sm font-semibold text-white">{step.headline}</span>
        </div>
        <div className="flex items-baseline gap-2">
          {verdictBadge && (
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", verdictBadge.className)}>
              {verdictBadge.label}
            </span>
          )}
          {step.evLossBB != null && step.evLossBB > 0 && (
            <span className="font-mono text-xs text-rose-300">
              -{formatBB(step.evLossBB)}
            </span>
          )}
        </div>
      </div>
      {step.reasoning && (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.reasoning}</p>
      )}
    </li>
  );
}

/* ─────────── Form → input transformation ─────────── */

function buildInput(form: FormState): HandInput | string {
  const ebb = parseFloat(form.effectiveBB);
  if (!Number.isFinite(ebb) || ebb < 1) return "Stack effective inválido.";
  if (form.heroPos === form.villainPos) return "Hero e vilão precisam estar em posições diferentes.";

  const heroA = parseCardString(form.heroCardA);
  const heroB = parseCardString(form.heroCardB);
  if (!heroA || !heroB) return "Cartas do hero inválidas (use formato Ah, Ks, Td, 2c).";
  if (heroA.rank === heroB.rank && heroA.suit === heroB.suit)
    return "As duas cartas do hero não podem ser idênticas.";

  const usedCards: CardModel[] = [heroA, heroB];
  function check(c: CardModel | null, label: string): string | null {
    if (!c) return `${label} inválida.`;
    if (usedCards.some((u) => u.rank === c.rank && u.suit === c.suit))
      return `${label} duplicada (já usada).`;
    usedCards.push(c);
    return null;
  }

  let flop, turn, river;
  if (form.hasFlop) {
    const fa = parseCardString(form.flopA);
    const fb = parseCardString(form.flopB);
    const fc = parseCardString(form.flopC);
    for (const [c, l] of [[fa, "Flop carta 1"], [fb, "Flop carta 2"], [fc, "Flop carta 3"]] as const) {
      const err = check(c, l);
      if (err) return err;
    }
    flop = { cards: [fa!, fb!, fc!] as [CardModel, CardModel, CardModel], actions: form.flopActions };
    if (form.hasTurn) {
      const tc = parseCardString(form.turnCard);
      const err = check(tc, "Turn");
      if (err) return err;
      turn = { card: tc!, actions: form.turnActions };
      if (form.hasRiver) {
        const rc = parseCardString(form.riverCard);
        const err2 = check(rc, "River");
        if (err2) return err2;
        river = { card: rc!, actions: form.riverActions };
      }
    }
  }

  return {
    format: form.format,
    effectiveBB: ebb,
    heroPos: form.heroPos,
    villainPos: form.villainPos,
    heroCards: [heroA, heroB],
    preflopActions: form.preflopActions,
    flop,
    turn,
    river,
  };
}
