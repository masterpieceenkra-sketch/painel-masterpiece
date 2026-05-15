import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Target, Video, FileText } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  book: BookOpen,
  target: Target,
  video: Video,
  file: FileText,
};

interface Props {
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  progress?: { done: number; total: number };
}

export function PlaybookCard({
  slug,
  title,
  description,
  category,
  icon,
  progress,
}: Props) {
  const Icon: LucideIcon = (icon ? iconMap[icon] : undefined) ?? BookOpen;
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <Link
      href={`/playbooks/${slug}`}
      className="card-masterpiece group block p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="rounded-sm border border-[var(--border-strong)] p-2.5 text-[var(--gold)]">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--gold)] transition" />
      </div>
      {category && (
        <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--gold)]/80">
          {category}
        </div>
      )}
      <h3 className="font-display mb-2 text-lg leading-tight">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--white)]/70 line-clamp-3 mb-5">
          {description}
        </p>
      )}
      {progress && progress.total > 0 && (
        <div>
          <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <span>Progresso</span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--navy-light)]">
            <div
              className="h-full bg-[var(--gold)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
