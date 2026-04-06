"use client";

import Link from "next/link";
import type { DealSummary } from "@/lib/types";

function StagePill({ stage, status }: { stage: string; status: string }) {
  if (status === "running") {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-blue/10 text-blue font-medium animate-pulse">
        Running...
      </span>
    );
  }

  const labels: Record<string, string> = {
    none: "Pending",
    screening: "Screened",
    deep: "Deep Diligence",
  };

  const colors: Record<string, string> = {
    none: "bg-gray-100 text-muted",
    screening: "bg-blue/10 text-blue",
    deep: "bg-navy/10 text-navy",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${colors[stage] || colors.none}`}
    >
      {labels[stage] || stage}
    </span>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  const color =
    score >= 7 ? "text-vc-green" : score >= 5 ? "text-vc-amber" : "text-vc-red";
  return (
    <span className={`font-mono font-bold text-xl ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function DealCard({ deal }: { deal: DealSummary }) {
  const date = new Date(deal.lastModified).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/deals/${deal.name}`}
      className="block bg-white rounded-lg border border-border p-5 hover:shadow-md hover:border-blue/40 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-navy truncate pr-3">
          {deal.displayName}
        </h3>
        {deal.totalScore !== null && (
          <ScoreIndicator score={deal.totalScore} />
        )}
      </div>

      <div className="flex items-center gap-3 text-sm mb-3">
        <StagePill stage={deal.stage} status={deal.status.state} />
        <span className="text-muted ml-auto text-xs">{date}</span>
      </div>

      {/* Thesis */}
      {deal.thesis && (
        <p className="text-xs text-muted leading-relaxed line-clamp-2">
          {deal.thesis}
        </p>
      )}
    </Link>
  );
}
