"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GitHubRepo, Tool } from "@/types";

interface ScanReportProps {
  scanId: string;
  repo: GitHubRepo;
  tool: Tool;
  status?: "scanning" | "completed" | "failed";
}

export function ScanReport({
  scanId,
  repo,
  tool,
  status = "scanning",
}: ScanReportProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Scan report</CardTitle>
          <Badge variant={status === "scanning" ? "secondary" : "outline"}>
            {status === "scanning" ? "Scanning" : status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your scan has been queued. Results will appear here once analysis is
          complete.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border bg-muted/30 p-6">
          {status === "scanning" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Loader2 className="size-10 animate-spin text-foreground" />
              <p className="font-medium">Scanning your codebase...</p>
              <p className="max-w-md text-sm text-muted-foreground">
                We&apos;re analyzing {repo.full_name} for security issues,
                performance problems, and DevOps gaps.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-green-600" />
              <p className="font-medium">Scan complete</p>
            </div>
          )}
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <dt className="text-xs text-muted-foreground">Repository</dt>
            <dd className="mt-1 font-medium">{repo.full_name}</dd>
          </div>
          <div className="rounded-lg border border-border p-4">
            <dt className="text-xs text-muted-foreground">Tool</dt>
            <dd className="mt-1 font-medium">{tool}</dd>
          </div>
          <div className="rounded-lg border border-border p-4 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Scan ID</dt>
            <dd className="mt-1 font-mono text-sm">{scanId}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/scan/${scanId}`} className="flex-1">
            <Button type="button" className="w-full gap-2">
              View Scan Details
              <ExternalLink className="size-4" />
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
