"use client";

import type { ComponentType } from "react";
import { Box, Code2, Heart, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TOOL_OPTIONS, type Tool } from "@/types";

const TOOL_ICONS: Record<Tool, ComponentType<{ className?: string }>> = {
  Cursor: Code2,
  Lovable: Heart,
  Bolt: Zap,
  V0: Box,
};

interface ToolSelectorProps {
  selectedTool: Tool | null;
  onSelect: (tool: Tool) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ToolSelector({
  selectedTool,
  onSelect,
  onNext,
  onBack,
}: ToolSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Which tool did you build with?</CardTitle>
        <p className="text-sm text-muted-foreground">
          We&apos;ll tailor fix prompts to your AI coding tool.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOL_OPTIONS.map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            const isSelected = selectedTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelect(tool.id)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all hover:bg-muted/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={onNext} disabled={!selectedTool}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
