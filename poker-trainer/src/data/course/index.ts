import type { CourseModule, Lesson } from "@/domain/course";
import { MODULE_1 } from "./module1";
import { MODULE_2 } from "./module2";
import { MODULE_3 } from "./module3";
import { MODULE_4 } from "./module4";

export const COURSE: CourseModule[] = [MODULE_1, MODULE_2, MODULE_3, MODULE_4];

const ALL_LESSONS: Lesson[] = COURSE.flatMap((m) => m.lessons);

export function allLessons(): Lesson[] {
  return ALL_LESSONS;
}

export function getLesson(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function moduleOfLesson(slug: string): CourseModule | undefined {
  return COURSE.find((m) => m.lessons.some((l) => l.slug === slug));
}

/** Próxima lição na ordem do currículo (ou null se for a última). */
export function nextLesson(slug: string): Lesson | null {
  const idx = ALL_LESSONS.findIndex((l) => l.slug === slug);
  if (idx < 0 || idx === ALL_LESSONS.length - 1) return null;
  return ALL_LESSONS[idx + 1];
}
