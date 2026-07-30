import Link from "next/link";
import { listRanges, listTopics, topicMatrixEntry } from "@/data";
import { MatrixSelector } from "@/components/MatrixSelector";

export default function HomePage() {
  const topics = listTopics();
  const entries = topics
    .map(topicMatrixEntry)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  const ranges = listRanges();
  // ICM scenarios = matrix entries flagged with an icmStage (bubble/finalTable).
  // Counted off entries (not raw spots) so the hero pill matches the matrix's ICM tab.
  const icmCount = entries.filter((e) => e.icmStage != null).length;

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span aria-hidden="true" className="text-base leading-none">
              ♠
            </span>
            MTT GTO Trainer
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Treine como num torneio real
          </h1>
          <p className="max-w-2xl text-base text-slate-400 sm:text-lg">
            MTT GTO trainer — push/fold, opens, 3-bets, ICM e pós-flop. Treine, erre, aprenda
            o porquê.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2 sm:gap-3" aria-label="Resumo do conteúdo">
          <StatPill icon="♣" value={topics.length} label="tópicos" tone="emerald" />
          <StatPill icon="♦" value={ranges.length} label="ranges" tone="sky" />
          <StatPill icon="⚑" value={icmCount} label="cenários ICM" tone="amber" />
        </ul>
      </section>

      <section aria-labelledby="matrix-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="matrix-heading" className="text-xl font-semibold text-white">
            Matriz de treino
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">
            Escolha o nó de ação, posição e stack efetivo
          </p>
        </div>
        <MatrixSelector entries={entries} />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">
            Ranges de referência{" "}
            <span className="text-sm font-normal text-slate-500">({ranges.length})</span>
          </h2>
          <Link
            href="/ranges"
            className="rounded-md text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Ver todas →
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ranges.slice(0, 8).map((r) => (
            <li key={r.id}>
              <Link
                href={`/ranges/${r.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 rounded bg-slate-800/70 px-2 py-0.5 font-mono text-xs text-slate-400">
                  {r.effectiveBB}BB
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        <strong className="text-slate-200">Roadmap:</strong> Matriz pré-flop expandida nesta
        fase (push/fold curto, opens deep, primeiros 3-bets). Próximas: ICM, mais postflop,
        atalhos de teclado.
      </section>
    </div>
  );
}

type Tone = "emerald" | "sky" | "amber";

// Tone classes are listed in full (not interpolated) so Tailwind's JIT picks
// them up at build time. The data-pill-value selector keeps the numeric
// strong-color in the same declaration as the rest of the pill skin.
const TONE_CLASSES: Record<Tone, string> = {
  emerald:
    "border-emerald-700/50 bg-emerald-950/40 text-emerald-200 [&_[data-pill-value]]:text-emerald-300",
  sky: "border-sky-700/50 bg-sky-950/40 text-sky-200 [&_[data-pill-value]]:text-sky-300",
  amber:
    "border-amber-700/50 bg-amber-950/40 text-amber-200 [&_[data-pill-value]]:text-amber-300",
};

function StatPill({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone: Tone;
}) {
  return (
    <li
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {icon}
      </span>
      <span data-pill-value className="font-mono text-sm font-bold tabular-nums">
        {value}
      </span>
      <span className="uppercase tracking-wide">{label}</span>
    </li>
  );
}
