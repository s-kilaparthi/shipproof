import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ScanLimitReachedProps {
  repoName: string;
  scanDate: string;
  issueCount: number;
  critical: number;
  warning: number;
  info: number;
  score: number | null;
  lastScanId: string;
}

export function ScanLimitReached({
  repoName,
  scanDate,
  issueCount,
  critical,
  warning,
  info,
  score,
  lastScanId,
}: ScanLimitReachedProps) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-xl border-2 border-gray-900 p-6 dark:border-white sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          You&apos;ve used your free scan!
        </h1>

        <p className="mt-6 text-sm font-medium text-foreground">
          Here&apos;s what we found in your last scan:
        </p>

        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-sm text-foreground">
            <span className="font-medium">{repoName}</span>
            <span className="text-muted-foreground">
              {" "}
              · {scanDate} · {issueCount} issue
              {issueCount === 1 ? "" : "s"} found
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-red-500">{critical} critical</span>
            {" · "}
            <span className="font-medium text-amber-500">
              {warning} warning{warning === 1 ? "" : "s"}
            </span>
            {" · "}
            <span className="font-medium text-gray-500">
              {info} info
            </span>
          </p>
          {score != null ? (
            <p className="mt-2 text-sm text-foreground">
              Score: <span className="font-semibold">{score}</span>
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">To keep scanning:</p>

        <div className="mt-4 flex flex-col gap-3">
          <Link href="/pricing">
            <Button className="h-11 w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              Join Waitlist — $9 for 3 scans
            </Button>
          </Link>
          <Link href={`/scan/${lastScanId}/report`}>
            <Button
              variant="outline"
              className="h-11 w-full border-gray-900 dark:border-gray-100"
            >
              View Your Last Report
            </Button>
          </Link>
          <Link
            href="/dashboard"
            className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
