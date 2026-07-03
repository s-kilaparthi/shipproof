"use client";

import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface StartNewScanProps {
  canScan: boolean;
  lastScanId?: string | null;
  lastIssueCount?: number;
}

export function StartNewScan({
  canScan,
  lastScanId,
  lastIssueCount = 0,
}: StartNewScanProps) {
  const [showLimitMessage, setShowLimitMessage] = useState(false);

  if (canScan) {
    return (
      <Link href="/scan/new" className="block w-full sm:inline-block sm:w-auto">
        <Button className="w-full gap-2 sm:w-auto">
          <ScanSearch className="size-4" />
          Start New Scan
        </Button>
      </Link>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <Button
        type="button"
        className="w-full gap-2 sm:w-auto"
        onClick={() => setShowLimitMessage(true)}
      >
        <ScanSearch className="size-4" />
        Start New Scan
      </Button>

      {showLimitMessage ? (
        <div className="mt-4 rounded-xl border-2 border-gray-900 p-4 dark:border-white sm:p-5">
          <p className="text-sm font-medium text-foreground">
            You&apos;ve used your free scan.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your last scan found {lastIssueCount} issue
            {lastIssueCount === 1 ? "" : "s"}.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {lastScanId ? (
              <Link href={`/scan/${lastScanId}/report`} className="sm:flex-1">
                <Button variant="outline" className="w-full border-gray-900 dark:border-gray-100">
                  View Last Report
                </Button>
              </Link>
            ) : null}
            <Link href="/pricing" className="sm:flex-1">
              <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                Get 3 Scans — $9 →
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
