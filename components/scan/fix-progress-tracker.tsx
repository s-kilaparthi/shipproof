"use client";

import Link from "next/link";

interface FixProgressTrackerProps {
  fixedCount: number;
  totalCount: number;
  rescanHref: string;
  onRescanClick?: () => void;
}

export function FixProgressTracker({
  fixedCount,
  totalCount,
  rescanHref,
  onRescanClick,
}: FixProgressTrackerProps) {
  const percent = totalCount > 0 ? Math.round((fixedCount / totalCount) * 100) : 0;
  const allFixed = totalCount > 0 && fixedCount >= totalCount;

  return (
    <div className="mb-6 space-y-3 border border-gray-100 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/50 sm:px-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Fix progress
        </h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {fixedCount} of {totalCount} issues marked as fixed
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gray-900 transition-all duration-300 dark:bg-white"
          style={{ width: `${percent}%` }}
        />
      </div>

      {allFixed ? (
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            All fixes marked. Run a fresh scan to verify your improvements.
          </p>
          <Link
            href={rescanHref}
            onClick={onRescanClick}
            className="text-xs font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100"
          >
            Rescan now →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
