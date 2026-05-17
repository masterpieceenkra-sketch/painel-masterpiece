import Link from "next/link";
import { listTopics } from "@/data";
import { ProgressoView } from "./ProgressoView";

export default function ProgressoPage() {
  const topics = listTopics();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Progresso</h1>
        <p className="mt-1 text-sm text-slate-400">
          Acerto por tópico, EV médio perdido e mãos com mais erros. Dados salvos localmente no
          seu navegador.
        </p>
      </div>
      <ProgressoView
        topics={topics.map((t) => ({
          id: t.id,
          title: t.title,
          slug: t.slug,
          targetAttempts: t.targetAttempts,
        }))}
      />
    </div>
  );
}
