import type { LessonBlock } from "@/domain/course";
import { Card } from "@/components/Card";
import { parseCardString } from "@/engine/handAnalyzer";
import { cn } from "@/lib/cn";
import type { Card as CardType } from "@/domain/cards";

/**
 * Renderizadores dos blocos de conteúdo das lições — teoria + demonstrações
 * visuais reutilizando o componente Card da plataforma.
 */

function cards(strings: string[]): CardType[] {
  return strings
    .map((s) => parseCardString(s))
    .filter((c): c is CardType => c != null);
}

/* ─────────── demos fixas ─────────── */

const HAND_RANK_ROWS: { label: string; example: string[]; note: string }[] = [
  { label: "1. Royal flush", example: ["As", "Ks", "Qs", "Js", "Ts"], note: "A sequência máxima, todas do mesmo naipe" },
  { label: "2. Straight flush", example: ["9h", "8h", "7h", "6h", "5h"], note: "Sequência do mesmo naipe" },
  { label: "3. Quadra", example: ["Qc", "Qd", "Qh", "Qs", "3c"], note: "Quatro cartas iguais" },
  { label: "4. Full house", example: ["Jc", "Jd", "Jh", "8s", "8c"], note: "Trinca + par" },
  { label: "5. Flush", example: ["Kd", "Td", "8d", "5d", "2d"], note: "Cinco do mesmo naipe" },
  { label: "6. Sequência", example: ["8c", "7d", "6h", "5s", "4c"], note: "Cinco em ordem (A vale alto ou baixo)" },
  { label: "7. Trinca", example: ["7c", "7d", "7h", "Ks", "2d"], note: "Três iguais" },
  { label: "8. Dois pares", example: ["Ac", "Ad", "9s", "9h", "4c"], note: "Desempate: par maior, depois kicker" },
  { label: "9. Par", example: ["Tc", "Td", "As", "7h", "3c"], note: "Desempate pelos kickers" },
  { label: "10. Carta alta", example: ["Ac", "Jd", "8s", "6h", "3c"], note: "Nada conectou — vale a maior" },
];

function HandRankChart() {
  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4">
      {HAND_RANK_ROWS.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0"
        >
          <span className="w-36 shrink-0 text-sm font-semibold text-white">{row.label}</span>
          <div className="flex gap-1">
            {cards(row.example).map((c, i) => (
              <Card key={i} card={c} size="sm" />
            ))}
          </div>
          <span className="text-xs text-slate-400">{row.note}</span>
        </div>
      ))}
    </div>
  );
}

const SEAT_LAYOUT: { pos: string; note: string; highlight?: boolean }[] = [
  { pos: "UTG", note: "1º a agir pré-flop" },
  { pos: "HJ", note: "hijack" },
  { pos: "CO", note: "cutoff" },
  { pos: "BTN", note: "melhor posição", highlight: true },
  { pos: "SB", note: "blind 0.5 — 1º pós-flop" },
  { pos: "BB", note: "blind 1 — último pré-flop" },
];

function PositionsDemo() {
  return (
    <div
      className="rounded-2xl border border-emerald-900/60 p-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at center, #065f46 0%, #064e3b 60%, #022c22 100%)",
      }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SEAT_LAYOUT.map((seat) => (
          <div
            key={seat.pos}
            className={cn(
              "rounded-lg border px-3 py-2 text-center",
              seat.highlight
                ? "border-amber-400/80 bg-black/30"
                : "border-white/15 bg-black/20",
            )}
          >
            <p
              className={cn(
                "text-sm font-bold",
                seat.highlight ? "text-amber-300" : "text-white",
              )}
            >
              {seat.pos}
              {seat.highlight && " ⭐"}
            </p>
            <p className="text-[11px] text-emerald-100/70">{seat.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-emerald-100/60">
        Ordem de ação pós-flop: SB → BB → UTG → HJ → CO → BTN (o button fecha
        todos os streets)
      </p>
    </div>
  );
}

/* ─────────── render principal ─────────── */

export function LessonBlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-sm leading-relaxed text-slate-300">{block.text}</p>;

    case "h":
      return <h3 className="pt-2 text-base font-semibold text-white">{block.text}</h3>;

    case "list":
      return (
        <ul className="space-y-1.5 text-sm text-slate-300">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-400">
                ▸
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "tip":
      return (
        <div
          className={cn(
            "rounded-lg border p-3 text-sm leading-relaxed",
            block.tone === "warn"
              ? "border-amber-700/60 bg-amber-950/30 text-amber-100"
              : "border-sky-800/60 bg-sky-950/30 text-sky-100",
          )}
        >
          <span aria-hidden="true" className="mr-1.5">
            {block.tone === "warn" ? "⚠️" : "💡"}
          </span>
          {block.text}
        </div>
      );

    case "cards":
      return (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4">
          {block.rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {cards(row.cards).map((c, j) => (
                  <Card key={j} card={c} size="sm" />
                ))}
              </div>
              <p className="min-w-40 flex-1 text-xs leading-relaxed text-slate-400">
                {row.caption}
              </p>
            </div>
          ))}
        </div>
      );

    case "board":
      return (
        <div
          className="rounded-xl border border-emerald-900/60 p-4"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, #065f46 0%, #064e3b 60%, #022c22 100%)",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex gap-1.5">
              {cards(block.board).map((c, i) => (
                <Card key={i} card={c} size="md" />
              ))}
            </div>
            {block.hero && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-100/70">
                  Sua mão
                </span>
                <div className="flex gap-1">
                  {cards(block.hero).map((c, i) => (
                    <Card key={i} card={c} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-emerald-100/80">
            {block.caption}
          </p>
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/60 last:border-b-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-2 text-sm",
                        j === 0 ? "font-medium text-slate-200" : "text-slate-400",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "handrank":
      return <HandRankChart />;

    case "positions":
      return <PositionsDemo />;
  }
}
