"use client";

import type { ScanResult } from "@/types";

interface ScanReportProps {
  result?: ScanResult;
}

export function ScanReport({ result }: ScanReportProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Scan Report</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {result?.summary ?? "Your scan results will appear here."}
      </p>
    </div>
  );
}
