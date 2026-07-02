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
      className="relative mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100 sm:px-6"
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 rounded-md p-1 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
      <p className="pr-8 text-base font-semibold sm:text-lg">
        Your score improved from {previousScore} to {currentScore}!
      </p>
      <p className="mt-1 text-sm text-green-800 dark:text-green-200">
        You fixed {fixedCount} issue{fixedCount === 1 ? "" : "s"} since your last
        scan. {remainingCount} issue{remainingCount === 1 ? "" : "s"} remaining.
      </p>
    </div>
  );
}
