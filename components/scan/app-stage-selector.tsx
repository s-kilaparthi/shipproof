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
  onSkip: () => void;
  onBack: () => void;
}

export function AppStageSelector({
  selectedStage,
  onSelect,
  onNext,
  onSkip,
  onBack,
}: AppStageSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How live is your app?</CardTitle>
        <p className="text-sm text-muted-foreground">
          This helps us prioritize what matters most
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {APP_STAGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedStage === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left transition-colors",
                  isSelected
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-border bg-background hover:border-black/40 dark:hover:border-white/40"
                )}
              >
                <Icon className="size-6 shrink-0" />
                <span className="text-base font-semibold">{option.title}</span>
                <span
                  className={cn(
                    "text-sm",
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

        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Skip this question →
        </button>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={onNext} disabled={!selectedStage}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
