"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FixProgressTrackerProps {
  fixedCount: number;
  totalCount: number;
  rescanHref: string;
  onRescanClick?: () => void;
}

function getProgressBarColor(percent: number): string {
  if (percent >= 100) return "bg-green-500";
  if (percent >= 67) return "bg-blue-500";
  if (percent >= 34) return "bg-amber-500";
  return "bg-red-500";
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
    <div className="mb-8 space-y-4 rounded-xl border border-border bg-muted/20 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Fix Progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {fixedCount} of {totalCount} issues marked as fixed
        </p>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getProgressBarColor(percent)
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {allFixed ? (
        <p className="text-sm font-medium text-green-600">
          All fixes applied! Ready to rescan?
        </p>
      ) : null}

      {allFixed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <p className="text-sm text-foreground">
            Great work! You&apos;ve applied all fixes. Run a fresh scan to verify
            your improvements.
          </p>
          <Link href={rescanHref} onClick={onRescanClick} className="mt-3 inline-block">
            <Button size="sm">Rescan Now</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
