"use client";

import { Hammer, Rocket, TrendingUp, Users } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppStage } from "@/types";

const APP_STAGE_OPTIONS: {
  id: AppStage;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "building",
    title: "Still building",
    subtitle: "Haven't deployed yet",
    icon: Hammer,
  },
  {
    id: "deployed",
    title: "Just deployed",
    subtitle: "Live but no real users yet",
    icon: Rocket,
  },
  {
    id: "live_small",
    title: "Live with users",
    subtitle: "1–100 real users",
    icon: Users,
  },
  {
    id: "live_growing",
    title: "Growing fast",
    subtitle: "100+ users",
    icon: TrendingUp,
  },
];

interface AppStageSelectorProps {
  selectedStage: AppStage | null;
  onSelect: (stage: AppStage) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AppStageSelector({
  selectedStage,
  onSelect,
  onNext,
  onBack,
}: AppStageSelectorProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg">How live is your app?</CardTitle>
        <p className="text-sm text-muted-foreground">
          This helps us prioritize what matters most
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {APP_STAGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedStage === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-200 bg-background hover:border-black/40 dark:border-gray-800 dark:hover:border-white/40"
                )}
              >
                <Icon className="size-6 shrink-0" />
                <span className="text-sm font-semibold leading-tight">
                  {option.title}
                </span>
                <span
                  className={cn(
                    "text-xs leading-snug",
                    isSelected
                      ? "text-white/80 dark:text-black/70"
                      : "text-muted-foreground"
                  )}
                >
                  {option.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={onNext} disabled={!selectedStage}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
