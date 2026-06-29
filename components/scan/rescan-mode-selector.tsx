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
    <Card>
      <CardHeader>
        <CardTitle>Choose scan mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          You have a saved discovery from this repo. Pick how you want to rescan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {discoveryAgeDays > 7 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            💡 Your discovery is {discoveryAgeRounded} day
            {discoveryAgeRounded === 1 ? "" : "s"} old. We recommend a Full
            Rescan if you&apos;ve added new features or changed your tech stack
            — but Quick Rescan still works.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            role="button"
            tabIndex={0}
            onClick={onQuickRescan}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onQuickRescan();
            }}
            className={cn(
              "cursor-pointer rounded-xl border border-border bg-muted/20 p-5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:ring-2 hover:ring-primary/20",
              isSubmitting && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Zap className="size-5 text-primary" />
              Quick Rescan
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your saved discovery from {discoveryAgeLabel}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Faster — no need to run the discovery prompt again
            </p>
            <Button type="button" className="mt-4 w-full pointer-events-none">
              Select Quick Rescan
            </Button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={onFullRescan}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onFullRescan();
            }}
            className={cn(
              "cursor-pointer rounded-xl border border-border bg-muted/20 p-5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:ring-2 hover:ring-primary/20",
              isSubmitting && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="size-5 text-primary" />
              Full Rescan
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the discovery prompt again in {tool}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              More accurate if you&apos;ve changed your tech stack
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full pointer-events-none"
            >
              Select Full Rescan
            </Button>
          </div>
        </div>

        <div className="flex justify-start pt-2">
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
