"use client";

import {
  getHealthScoreBg,
  getHealthScoreColor,
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

function ConfidenceBadge({ confidence }: { confidence: string }) {
  if (confidence === "high") {
    return <span className="text-xs text-green-600">✓</span>;
  }
  if (confidence === "medium") {
    return (
      <span className="text-xs text-muted-foreground" title="Score based on partial data">
        ℹ️
      </span>
    );
  }
  if (confidence === "low") {
    return (
      <span className="text-xs text-amber-600" title="Limited data available for this pillar">
        ⚠️
      </span>
    );
  }
  return null;
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
      className={cn(
        "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
        getHealthScoreBg(detail)
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <ConfidenceBadge confidence={detail.confidence} />
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          detail.confidence === "insufficient"
            ? "text-muted-foreground"
            : getHealthScoreColor(numericScore)
        )}
      >
        {displayScore}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </button>
  );
}
