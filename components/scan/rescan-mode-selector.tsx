"use client";

import { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

type RescanMode = "quick" | "full";

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
  const [selectedMode, setSelectedMode] = useState<RescanMode | null>(null);
  const discoveryAgeRounded = Math.floor(discoveryAgeDays);

  const handleSelect = (mode: RescanMode) => {
    setSelectedMode(mode);
    if (mode === "quick") {
      onQuickRescan();
    } else {
      onFullRescan();
    }
  };

  const modes: {
    id: RescanMode;
    title: string;
    description: string;
    icon: typeof Zap;
  }[] = [
    {
      id: "quick",
      title: "Quick rescan",
      description: `Use saved discovery from ${discoveryAgeLabel}`,
      icon: Zap,
    },
    {
      id: "full",
      title: "Full rescan",
      description: `Run discovery again in ${tool}`,
      icon: RefreshCw,
    },
  ];

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg">Choose scan mode</CardTitle>
        <p className="text-sm text-muted-foreground">
          You have a saved discovery from this repo.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {discoveryAgeDays > 7 && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-muted-foreground dark:border-gray-800 dark:bg-gray-900/50">
            Discovery is {discoveryAgeRounded} day
            {discoveryAgeRounded === 1 ? "" : "s"} old — consider a full rescan if
            your stack changed.
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                className={cn(
                  "flex min-h-36 flex-1 flex-col rounded-xl p-6 transition-colors",
                  isSelected
                    ? "border-2 border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800"
                    : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                )}
              >
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedMode(mode.id)}
                  className="flex flex-1 flex-col items-start text-left disabled:opacity-50"
                >
                  <Icon className="size-8 text-foreground" />
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {mode.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </p>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  disabled={isSubmitting}
                  className={cn(
                    "mt-4 w-full sm:w-auto",
                    isSelected &&
                      "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                  )}
                  onClick={() => handleSelect(mode.id)}
                >
                  Select
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
