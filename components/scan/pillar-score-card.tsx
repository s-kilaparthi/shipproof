"use client";

import {
  getPillarConfidenceHint,
  getPillarConfidenceLabel,
  getPillarDisplayScore,
  getPillarNumericScore,
  getPillarScoreDetail,
} from "@/lib/scan/health-score";
import { cn } from "@/lib/utils";
import type { DisplayPillar, PillarScores } from "@/types";

interface PillarScoreCardProps {
  pillarId: DisplayPillar;
  label: string;
  pillarScores: PillarScores;
  onClick?: () => void;
}

function getScoreTextColor(
  numericScore: number,
  confidence: string,
  displayScore: string
): string {
  if (confidence === "insufficient" || displayScore === "—") {
    return "text-gray-300";
  }
  if (numericScore < 50) return "text-red-500";
  if (numericScore <= 79) return "text-amber-500";
  return "text-gray-900 dark:text-white";
}

export function PillarScoreCard({
  pillarId,
  label,
  pillarScores,
  onClick,
}: PillarScoreCardProps) {
  const detail = getPillarScoreDetail(pillarScores, pillarId);
  const displayScore = getPillarDisplayScore(detail);
  const numericScore = getPillarNumericScore(detail);
  const hint = getPillarConfidenceHint(detail.confidence);
  const tooltip = getPillarConfidenceLabel(detail.confidence);

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="w-full rounded-xl border border-gray-900 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800/80"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-bold",
          getScoreTextColor(numericScore, detail.confidence, displayScore)
        )}
      >
        {displayScore}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : (
        <p className="mt-1 text-xs text-transparent select-none" aria-hidden>
          —
        </p>
      )}
    </button>
  );
}
