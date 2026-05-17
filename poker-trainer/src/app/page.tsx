import Link from "next/link";
import { TopicCard } from "@/components/TopicCard";
import { listRanges, listTopics } from "@/data";

export default function HomePage() {
  const topics = listTopics();
  const ranges = listRanges();
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold text-white">Sessões guiadas</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Escolha um tópico para treinar. Cada drill sorteia uma mão e situação, você decide,
          e o solver mostra a ação ótima, o mix GTO e o porquê.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-white">Ranges de referência</h2>
          <Link href="/ranges" className="text-sm text-emerald-400 hover:text-emerald-300">
            Ver todas →
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ranges.map((r) => (
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
        <strong className="text-slate-200">Roadmap:</strong> Fase 2 entregue (7 tópicos +
        heatmap de range). Próximas fases: spots pós-flop com explicações escritas e
        dashboard de progresso com fraquezas por mão.
      </section>
    </div>
  );
}
