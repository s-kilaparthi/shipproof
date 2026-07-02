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
    return "text-gray-400";
  }
  if (numericScore < 50) return "text-red-500";
  if (numericScore <= 79) return "text-amber-500";
  return "text-green-600 dark:text-green-400";
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
      className="border border-gray-100 bg-transparent p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 sm:p-4"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold",
          getScoreTextColor(numericScore, detail.confidence, displayScore)
        )}
      >
        {displayScore}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
    </button>
  );
}
