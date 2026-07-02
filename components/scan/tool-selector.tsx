"use client";

import type { ComponentType } from "react";
import {
  Bot,
  Box,
  Brain,
  Cloud,
  Code2,
  Heart,
  MoreHorizontal,
  Wind,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TOOL_OPTIONS, type Tool } from "@/types";

const TOOL_ICONS: Record<Tool, ComponentType<{ className?: string }>> = {
  Cursor: Code2,
  Lovable: Heart,
  Bolt: Zap,
  V0: Box,
  "Claude Code": Bot,
  Codex: Brain,
  Replit: Cloud,
  Windsurf: Wind,
  Other: MoreHorizontal,
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
    <Card className="flex h-full min-h-0 flex-col shadow-none">
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <CardTitle className="text-lg">Which tool did you build with?</CardTitle>
        <p className="text-sm text-muted-foreground">
          We&apos;ll tailor fix prompts to your AI coding tool.
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-4 pt-0">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {TOOL_OPTIONS.map((tool) => {
              const Icon = TOOL_ICONS[tool.id];
              const isSelected = selectedTool === tool.id;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    isSelected
                      ? "border-2 border-black bg-muted/50 dark:border-white"
                      : "border-gray-200 dark:border-gray-800"
                  )}
                >
                  <Icon className="size-6 text-foreground" />
                  <div>
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {tool.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
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
