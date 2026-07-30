import { CourseOverview } from "./CourseOverview";

export default function AprenderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Aprender poker</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Curso completo do zero ao avançado. Cada lição tem teoria,
          demonstração visual e um quiz — passe no quiz (70%+) para concluir e
          pratique o conceito nos drills ou contra o bot.
        </p>
      </div>
      <CourseOverview />
    </div>
  );
}
