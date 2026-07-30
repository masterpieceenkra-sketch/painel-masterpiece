"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PostflopSpot } from "@/domain/postflop";
import type { PreflopRange } from "@/domain/range";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";
import { botDecide, type BotContext, type BotDecision } from "@/engine/aiPlayer";
import {
  applyAction,
  legalActions,
  startHand,
  totalPot,
  type HandState,
  type PlayerId,
  type StreetName,
} from "@/engine/game";
import type { Action } from "@/domain/cards";

const STREET_LABEL: Record<StreetName, string> = {
  preflop: "Pré-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

type CoachEntry = {
  street: StreetName;
  headline: string;
  reasoning: string;
};

type SessionCfg = {
  startStack: number;
  coachLive: boolean;
};

function fmtBB(v: number): string {
  return Number.isInteger(v) ? `${v}` : v.toFixed(1);
}

export function PlayView({
  ranges,
  postflopSpots,
}: {
  ranges: PreflopRange[];
  postflopSpots: PostflopSpot[];
}) {
  const ctx: BotContext = useMemo(
    () => ({ ranges, postflopSpots }),
    [ranges, postflopSpots],
  );

  const [cfg, setCfg] = useState<SessionCfg | null>(null);
  const [hand, setHand] = useState<HandState | null>(null);
  const [handNo, setHandNo] = useState(1);
  const [button, setButton] = useState<PlayerId>("hero");
  const [coach, setCoach] = useState<CoachEntry[]>([]);
  const [score, setScore] = useState({ hero: 0, bot: 0 });
  const [botThinking, setBotThinking] = useState(false);
  const [endStacks, setEndStacks] = useState<{ hero: number; bot: number } | null>(null);

  // Turno do bot: pequeno delay para a mesa "respirar" antes da decisão.
  const handRef = useRef(hand);
  handRef.current = hand;
  useEffect(() => {
    if (!hand || hand.result || hand.toAct !== "bot") return;
    setBotThinking(true);
    const t = setTimeout(() => {
      const current = handRef.current;
      if (!current || current.result || current.toAct !== "bot") return;
      const decision: BotDecision = botDecide(current, "bot", ctx);
      setCoach((c) => [
        ...c,
        {
          street: current.street,
          headline: decision.headline,
          reasoning: decision.reasoning,
        },
      ]);
      setHand(applyAction(current, "bot", decision.action));
      setBotThinking(false);
    }, 850);
    return () => {
      clearTimeout(t);
      setBotThinking(false);
    };
  }, [hand, ctx]);

  function startSession(startStack: number, coachLive: boolean) {
    setCfg({ startStack, coachLive });
    setScore({ hero: 0, bot: 0 });
    setHandNo(1);
    setButton("hero");
    setCoach([]);
    setHand(startHand({ hero: startStack, bot: startStack }, "hero"));
  }

  function nextHand() {
    if (!hand?.result) return;
    const heroStack = hand.players.hero.stackBB;
    const botStack = hand.players.bot.stackBB;
    if (hand.result.winner === "hero") setScore((s) => ({ ...s, hero: s.hero + 1 }));
    else if (hand.result.winner === "bot") setScore((s) => ({ ...s, bot: s.bot + 1 }));
    if (heroStack <= 0 || botStack <= 0) {
      // Bust — troca a mesa pela tela de fim de sessão.
      setHand(null);
      setCoach([]);
      setEndStacks({ hero: heroStack, bot: botStack });
      return;
    }
    const nextButton: PlayerId = button === "hero" ? "bot" : "hero";
    setButton(nextButton);
    setHandNo((n) => n + 1);
    setCoach([]);
    setHand(startHand({ hero: heroStack, bot: botStack }, nextButton));
  }

  function heroAct(action: Action) {
    if (!hand || hand.toAct !== "hero" || hand.result) return;
    setHand(applyAction(hand, "hero", action));
  }

  /* ─────────── telas ─────────── */

  if (!cfg) {
    return <SetupScreen onStart={startSession} />;
  }

  if (endStacks) {
    const heroWon = endStacks.bot <= 0;
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-3xl">{heroWon ? "🏆" : "💀"}</p>
        <h2 className="mt-2 text-xl font-bold text-white">
          {heroWon ? "Você quebrou o bot!" : "O bot levou sua stack."}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Placar final: você {score.hero} × {score.bot} bot ({handNo} mãos).
        </p>
        <button
          type="button"
          onClick={() => {
            setEndStacks(null);
            setCfg(null);
          }}
          className="mt-4 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Nova sessão
        </button>
      </div>
    );
  }

  if (!hand) return null;

  const hero = hand.players.hero;
  const bot = hand.players.bot;
  const pot = totalPot(hand);
  const showBotCards =
    cfg.coachLive || (hand.result != null && hand.result.reason === "showdown");
  const coachVisible = cfg.coachLive || hand.result != null;
  const isHeroTurn = hand.toAct === "hero" && !hand.result;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {/* Barra da sessão */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Mão #{handNo} · Blinds 0.5/1 BB · Button:{" "}
            <span className="text-slate-200">{hand.button === "hero" ? "você" : "bot"}</span>
          </span>
          <span>
            Placar: <span className="text-emerald-400">{score.hero}</span> ×{" "}
            <span className="text-rose-400">{score.bot}</span>
            <button
              type="button"
              onClick={() => setCfg(null)}
              className="ml-3 rounded-sm text-slate-500 underline-offset-2 outline-none hover:text-slate-300 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Encerrar sessão
            </button>
          </span>
        </div>

        {/* Mesa */}
        <div
          className="rounded-2xl border border-emerald-900/60 p-4 sm:p-6"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, #065f46 0%, #064e3b 55%, #022c22 100%)",
          }}
        >
          {/* Bot */}
          <SeatRow
            name="GTO Bot 🤖"
            stackBB={bot.stackBB}
            committedBB={bot.committedBB}
            isButton={hand.button === "bot"}
            folded={bot.folded}
            active={hand.toAct === "bot" && !hand.result}
            thinking={botThinking}
          >
            <div className="flex gap-1.5">
              {showBotCards ? (
                <>
                  <Card card={bot.cards[0]} size="sm" />
                  <Card card={bot.cards[1]} size="sm" />
                </>
              ) : (
                <>
                  <Card card="back" size="sm" />
                  <Card card="back" size="sm" />
                </>
              )}
            </div>
          </SeatRow>

          {/* Centro: board + pote */}
          <div className="my-5 flex flex-col items-center gap-2">
            <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-xs text-amber-300">
              Pote: {fmtBB(pot)} BB · {STREET_LABEL[hand.street]}
            </span>
            <div className="flex min-h-20 items-center gap-1.5">
              {hand.board.length === 0 ? (
                <span className="text-xs text-emerald-200/50">— aguardando o flop —</span>
              ) : (
                hand.board.map((c, i) => <Card key={i} card={c} size="md" />)
              )}
            </div>
          </div>

          {/* Herói */}
          <SeatRow
            name="Você"
            stackBB={hero.stackBB}
            committedBB={hero.committedBB}
            isButton={hand.button === "hero"}
            folded={hero.folded}
            active={isHeroTurn}
            thinking={false}
          >
            <div className="flex gap-1.5">
              <Card card={hero.cards[0]} size="md" />
              <Card card={hero.cards[1]} size="md" />
            </div>
          </SeatRow>
        </div>

        {/* Resultado */}
        {hand.result && (
          <div
            className={cn(
              "rounded-xl border p-4",
              hand.result.winner === "hero"
                ? "border-emerald-700 bg-emerald-950/40"
                : hand.result.winner === "bot"
                  ? "border-rose-800 bg-rose-950/30"
                  : "border-slate-700 bg-slate-900/60",
            )}
          >
            <p className="text-sm font-semibold text-white">
              {hand.result.winner === "hero"
                ? `Você venceu o pote de ${fmtBB(hand.result.potBB)} BB`
                : hand.result.winner === "bot"
                  ? `Bot venceu o pote de ${fmtBB(hand.result.potBB)} BB`
                  : `Pote dividido (${fmtBB(hand.result.potBB)} BB)`}
              {hand.result.reason === "fold" ? " — por fold" : ""}
            </p>
            {hand.result.showdown && (
              <p className="mt-1 text-xs text-slate-400">
                Showdown: você com{" "}
                <span className="text-slate-200">{hand.result.showdown.hero.labelPt}</span> · bot
                com <span className="text-slate-200">{hand.result.showdown.bot.labelPt}</span>
              </p>
            )}
            <button
              type="button"
              onClick={nextHand}
              className="mt-3 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Próxima mão →
            </button>
          </div>
        )}

        {/* Ações do herói */}
        {isHeroTurn && <ActionBar hand={hand} onAct={heroAct} />}
        {!isHeroTurn && !hand.result && (
          <p className="animate-pulse text-center text-sm text-slate-400">
            Bot pensando…
          </p>
        )}

        {/* Histórico compacto */}
        <HistoryLine hand={hand} />
      </div>

      {/* Painel coach */}
      <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          🧠 Raciocínio do bot
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-400">
            {cfg.coachLive ? "ao vivo" : "pós-mão"}
          </span>
        </h2>
        {!coachVisible ? (
          <p className="mt-3 text-xs text-slate-500">
            As decisões do bot serão reveladas quando a mão terminar — tente
            prever o que ele faria.
          </p>
        ) : coach.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">O bot ainda não agiu nesta mão.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {coach.map((entry, i) => (
              <li key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold text-emerald-300">
                  <span className="mr-1.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    {STREET_LABEL[entry.street]}
                  </span>
                  {entry.headline}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {entry.reasoning}
                </p>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

/* ─────────── subcomponentes ─────────── */

function SetupScreen({
  onStart,
}: {
  onStart: (stack: number, coachLive: boolean) => void;
}) {
  const [stack, setStack] = useState(50);
  const [coachLive, setCoachLive] = useState(true);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Nova sessão heads-up</h2>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Stack inicial (cada jogador)
        </p>
        <div className="mt-2 flex gap-2">
          {[25, 50, 100].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStack(s)}
              className={cn(
                "min-h-11 rounded-md border px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400",
                stack === s
                  ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                  : "border-slate-700 text-slate-300 hover:border-slate-600",
              )}
            >
              {s} BB
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Modo coach</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setCoachLive(true)}
            className={cn(
              "min-h-11 rounded-md border px-4 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400",
              coachLive
                ? "border-emerald-500 bg-emerald-600/20 text-emerald-200"
                : "border-slate-700 text-slate-300 hover:border-slate-600",
            )}
          >
            <span className="font-semibold">Ao vivo</span>
            <span className="block text-xs text-slate-400">
              Cartas do bot abertas + raciocínio a cada ação (modo estudo)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCoachLive(false)}
            className={cn(
              "min-h-11 rounded-md border px-4 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400",
              !coachLive
                ? "border-emerald-500 bg-emerald-600/20 text-emerald-200"
                : "border-slate-700 text-slate-300 hover:border-slate-600",
            )}
          >
            <span className="font-semibold">Pós-mão</span>
            <span className="block text-xs text-slate-400">
              Jogo real: raciocínio e cartas só revelados no fim da mão
            </span>
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onStart(stack, coachLive)}
        className="mt-6 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        Começar ♠
      </button>
    </div>
  );
}

function SeatRow({
  name,
  stackBB,
  committedBB,
  isButton,
  folded,
  active,
  thinking,
  children,
}: {
  name: string;
  stackBB: number;
  committedBB: number;
  isButton: boolean;
  folded: boolean;
  active: boolean;
  thinking: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors sm:px-4",
        active ? "border-amber-400/70 bg-black/25" : "border-white/10 bg-black/15",
        folded && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3">
        {children}
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            {name}
            {isButton && (
              <span
                title="Dealer button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900"
              >
                D
              </span>
            )}
            {thinking && <span className="animate-pulse text-xs text-amber-300">…</span>}
          </p>
          <p className="font-mono text-xs text-emerald-200/80">
            Stack: {fmtBB(stackBB)} BB
            {folded && <span className="ml-2 text-rose-300">folded</span>}
          </p>
        </div>
      </div>
      {committedBB > 0 && (
        <span className="rounded-full bg-amber-400/15 px-2.5 py-1 font-mono text-xs text-amber-300">
          {fmtBB(committedBB)} BB
        </span>
      )}
    </div>
  );
}

function ActionBar({ hand, onAct }: { hand: HandState; onAct: (a: Action) => void }) {
  const la = legalActions(hand, "hero");
  const hero = hand.players.hero;
  const facing = la.callAmountBB > 0;
  const canRaise = la.kinds.includes("raise");

  // Presets de sizing: bets por fração do pote quando ninguém apostou;
  // raises 2.5x/3.5x quando enfrenta aposta. Sempre clampados no legal.
  const presets: { label: string; sizeBB: number }[] = [];
  if (canRaise) {
    const opp = hand.players.bot;
    const raw: { label: string; sizeBB: number }[] = facing
      ? [
          { label: "Raise 2.5x", sizeBB: opp.committedBB * 2.5 },
          { label: "Raise 3.5x", sizeBB: opp.committedBB * 3.5 },
        ]
      : [
          { label: "Bet 33%", sizeBB: hero.committedBB + la.potTotalBB * 0.33 },
          { label: "Bet 50%", sizeBB: hero.committedBB + la.potTotalBB * 0.5 },
          { label: "Bet 75%", sizeBB: hero.committedBB + la.potTotalBB * 0.75 },
          { label: "Bet pote", sizeBB: hero.committedBB + la.potTotalBB },
        ];
    const seen = new Set<number>();
    for (const p of raw) {
      const clamped = Math.round(Math.min(Math.max(p.sizeBB, la.minRaiseToBB), la.maxRaiseToBB) * 2) / 2;
      if (clamped >= la.maxRaiseToBB || seen.has(clamped)) continue;
      seen.add(clamped);
      presets.push({ label: `${p.label} (${fmtBB(clamped)})`, sizeBB: clamped });
    }
  }

  const btn =
    "min-h-11 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {la.kinds.includes("fold") && (
        <button type="button" onClick={() => onAct({ kind: "fold" })} className={cn(btn, "bg-rose-700 text-white hover:bg-rose-600")}>
          Fold
        </button>
      )}
      {la.kinds.includes("check") && (
        <button type="button" onClick={() => onAct({ kind: "check" })} className={cn(btn, "bg-slate-700 text-white hover:bg-slate-600")}>
          Check
        </button>
      )}
      {la.kinds.includes("call") && (
        <button type="button" onClick={() => onAct({ kind: "call" })} className={cn(btn, "bg-sky-700 text-white hover:bg-sky-600")}>
          Call {fmtBB(la.callAmountBB)} BB
        </button>
      )}
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onAct({ kind: "raise", sizeBB: p.sizeBB })}
          className={cn(btn, "bg-emerald-700 text-white hover:bg-emerald-600")}
        >
          {p.label}
        </button>
      ))}
      {la.kinds.includes("jam") && (
        <button type="button" onClick={() => onAct({ kind: "jam" })} className={cn(btn, "bg-amber-600 text-slate-950 hover:bg-amber-500")}>
          All-in ({fmtBB(la.maxRaiseToBB)})
        </button>
      )}
    </div>
  );
}

function HistoryLine({ hand }: { hand: HandState }) {
  if (hand.history.length === 0) return null;
  const byStreet = new Map<StreetName, string[]>();
  for (const e of hand.history) {
    const who = e.actor === "hero" ? "Você" : "Bot";
    const what =
      e.action.kind === "raise"
        ? `raise ${fmtBB(e.action.sizeBB)}BB`
        : e.action.kind === "jam"
          ? "all-in"
          : e.action.kind;
    const arr = byStreet.get(e.street) ?? [];
    arr.push(`${who} ${what}`);
    byStreet.set(e.street, arr);
  }
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
      {[...byStreet.entries()].map(([street, items]) => (
        <p key={street}>
          <span className="font-semibold text-slate-300">{STREET_LABEL[street]}:</span>{" "}
          {items.join(" · ")}
        </p>
      ))}
    </div>
  );
}
