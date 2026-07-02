"use client";

import { RefreshCw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

interface RescanModeSelectorProps {
  discoveryAgeLabel: string;
  discoveryAgeDays: number;
  tool: Tool;
  onQuickRescan: () => void;
  onFullRescan: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function RescanModeSelector({
  discoveryAgeLabel,
  discoveryAgeDays,
  tool,
  onQuickRescan,
  onFullRescan,
  onBack,
  isSubmitting = false,
}: RescanModeSelectorProps) {
  const discoveryAgeRounded = Math.floor(discoveryAgeDays);

  return (
    <Card className="flex h-full min-h-0 flex-col shadow-none">
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <CardTitle className="text-lg">Choose scan mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          You have a saved discovery from this repo.
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-4 pt-0">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {discoveryAgeDays > 7 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-muted-foreground dark:border-gray-800 dark:bg-gray-900/50">
              Discovery is {discoveryAgeRounded} day
              {discoveryAgeRounded === 1 ? "" : "s"} old — consider a full rescan
              if your stack changed.
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onQuickRescan}
              disabled={isSubmitting}
              className={cn(
                "rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-muted/50 dark:border-gray-800",
                isSubmitting && "pointer-events-none opacity-50"
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="size-4" />
                Quick rescan
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Use saved discovery from {discoveryAgeLabel}
              </p>
            </button>

            <button
              type="button"
              onClick={onFullRescan}
              disabled={isSubmitting}
              className={cn(
                "rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-muted/50 dark:border-gray-800",
                isSubmitting && "pointer-events-none opacity-50"
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <RefreshCw className="size-4" />
                Full rescan
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Run discovery again in {tool}
              </p>
            </button>
          </div>
        </div>

        <div className="mt-3 shrink-0 border-t border-gray-100 pt-3 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
