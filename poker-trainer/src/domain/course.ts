/**
 * Modelo do sistema de ensino: módulos → lições → blocos de conteúdo + quiz.
 * Cartas em blocos de demonstração usam a notação compacta "Ah", "Ks", etc.
 * (parseadas com parseCardString no render).
 */

export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; tone: "info" | "warn"; text: string }
  /** Linhas de mãos/cartas com legenda — ex.: comparar duas mãos. */
  | { type: "cards"; rows: { cards: string[]; caption: string }[] }
  /** Board comunitário + mão do herói opcional. */
  | { type: "board"; board: string[]; hero?: string[]; caption: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  /** Demonstrações fixas renderizadas por componentes dedicados. */
  | { type: "handrank" }
  | { type: "positions" };

export type QuizQuestion = {
  q: string;
  options: string[];
  /** Índice da opção correta. */
  correct: number;
  explain: string;
};

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  blocks: LessonBlock[];
  quiz: QuizQuestion[];
  practice?: { label: string; href: string };
};

export type CourseLevel = "básico" | "intermediário" | "avançado";

export type CourseModule = {
  id: string;
  title: string;
  level: CourseLevel;
  description: string;
  lessons: Lesson[];
};

/** Nota mínima no quiz (em %) para marcar a lição como concluída. */
export const PASS_SCORE_PCT = 70;
