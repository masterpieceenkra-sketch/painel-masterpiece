"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Topic } from "@/domain/topics";
import { summarize } from "@/domain/progress";
import { loadProgress } from "@/storage/localProgress";
import { ProgressBadge } from "./ProgressBadge";

export function TopicCard({ topic }: { topic: Topic }) {
  const [stats, setStats] = useState<{ total: number; correctPct: number } | null>(null);

  useEffect(() => {
    const p = loadProgress(topic.id);
    const s = summarize(p);
    setStats({ total: s.total, correctPct: s.correctPct });
  }, [topic.id]);

  return (
    <Link
      href={`/treino/${topic.slug}`}
      className="group block rounded-lg border border-slate-700 bg-slate-900 p-5 shadow transition-colors hover:border-emerald-500 hover:bg-slate-800"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-white group-hover:text-emerald-300">
          {topic.title}
        </h2>
        <ProgressBadge
          attempts={stats?.total ?? 0}
          target={topic.targetAttempts}
          correctPct={stats?.correctPct ?? 0}
        />
      </div>
      <p className="text-sm text-slate-400">{topic.description}</p>
    </Link>
  );
}
