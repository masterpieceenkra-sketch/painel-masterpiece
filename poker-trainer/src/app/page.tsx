import { TopicCard } from "@/components/TopicCard";
import { listTopics } from "@/data";

export default function HomePage() {
  const topics = listTopics();
  return (
    <div className="space-y-6">
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

      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        <strong className="text-slate-200">Roadmap:</strong> Fase 1 = 1 tópico ponta a ponta. Próximas fases adicionam mais ranges (BTN open, BB defense), heatmap visual de range, spots pós-flop e dashboard de progresso.
      </section>
    </div>
  );
}
