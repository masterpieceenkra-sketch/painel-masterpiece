import Link from "next/link";
import { listRanges, listTopics, topicMatrixEntry } from "@/data";
import { MatrixSelector } from "@/components/MatrixSelector";

export default function HomePage() {
  const topics = listTopics();
  const entries = topics
    .map(topicMatrixEntry)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  const ranges = listRanges();
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold text-white">Treine GTO MTT</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Escolha o nó de ação, posição e stack effective. Cada drill sorteia uma mão, você
          decide, e o solver mostra a ação ótima, o mix GTO e o porquê em pt-BR.
        </p>
      </section>

      <MatrixSelector entries={entries} />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-white">
            Ranges de referência ({ranges.length})
          </h2>
          <Link href="/ranges" className="text-sm text-emerald-400 hover:text-emerald-300">
            Ver todas →
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ranges.slice(0, 8).map((r) => (
            <li key={r.id}>
              <Link
                href={`/ranges/${r.id}`}
                className="block rounded border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-300"
              >
                {r.label}
                <span className="ml-2 text-xs text-slate-500">{r.effectiveBB}BB</span>
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
