"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ScoreCelebrationBannerProps {
  previousScore: number;
  currentScore: number;
  fixedCount: number;
  remainingCount: number;
}

export function ScoreCelebrationBanner({
  previousScore,
  currentScore,
  fixedCount,
  remainingCount,
}: ScoreCelebrationBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative mb-6 border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900/30 sm:px-5"
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
      <p className="pr-8 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Score improved from {previousScore} to{" "}
        <span className="text-green-600 dark:text-green-400">{currentScore}</span>
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {fixedCount} issue{fixedCount === 1 ? "" : "s"} resolved since last scan ·{" "}
        {remainingCount} remaining
      </p>
    </div>
  );
}
