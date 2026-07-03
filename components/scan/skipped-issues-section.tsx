"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { IssueCard } from "@/components/scan/issue-card";
import { cn } from "@/lib/utils";
import type { SkipReason } from "@/lib/scan/skipped-issues";
import type { ScanIssueRow, Tool } from "@/types";

interface SkippedIssuesSectionProps {
  issues: ScanIssueRow[];
  skippedIssues: Record<string, SkipReason>;
  tool: Tool;
  onUnskip: (issueId: string) => void;
}

export function SkippedIssuesSection({
  issues,
  skippedIssues,
  tool,
  onUnskip,
}: SkippedIssuesSectionProps) {
  const skippedIds = Object.keys(skippedIssues);
  const skippedIssuesList = issues.filter((issue) => skippedIds.includes(issue.id));
  const [isOpen, setIsOpen] = useState(false);

  if (skippedIssuesList.length === 0) return null;

  return (
    <section className="mt-6 border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/20">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
      >
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Skipped issues ({skippedIssuesList.length})
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 dark:border-gray-800">
            {skippedIssuesList.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                tool={tool}
                isSkipped
                skipReason={skippedIssues[issue.id] ?? null}
                collapsedByDefault
                onUnskip={() => onUnskip(issue.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
