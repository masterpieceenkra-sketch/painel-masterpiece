import Link from "next/link";
import { notFound } from "next/navigation";
import { allLessons, getLesson, moduleOfLesson, nextLesson } from "@/data/course";
import { LessonView } from "./LessonView";

export function generateStaticParams() {
  return allLessons().map((l) => ({ lessonSlug: l.slug }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonSlug: string }>;
}) {
  const { lessonSlug } = await params;
  const lesson = getLesson(lessonSlug);
  if (!lesson) notFound();
  const mod = moduleOfLesson(lessonSlug);
  const next = nextLesson(lessonSlug);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/aprender" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar ao curso
        </Link>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {mod?.title} · ~{lesson.minutes} min
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">{lesson.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{lesson.summary}</p>
      </div>
      <LessonView
        lesson={lesson}
        nextLesson={next ? { slug: next.slug, title: next.title } : null}
      />
    </div>
  );
}
