"use client";

import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSeverityColor } from "@/lib/scan/health-score";
import type { Confidence, ScanIssueRow, Tool } from "@/types";

interface IssueCardProps {
  issue: ScanIssueRow;
  tool: Tool;
}

function confidenceLabel(confidence?: Confidence): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "low") return "Low Confidence";
  return "Medium Confidence";
}

function confidenceBadgeClass(confidence?: Confidence): string {
  if (confidence === "high") return "bg-green-100 text-green-700 border-green-200";
  if (confidence === "low") return "bg-muted text-muted-foreground border-border";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

export function IssueCard({ issue, tool }: IssueCardProps) {
  const [fixExpanded, setFixExpanded] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(issue.fix_prompt);
      setCopied(true);
      toast.success("Fix prompt copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={getSeverityColor(issue.severity)}
              >
                {issue.severity}
              </Badge>
              <Badge
                variant="outline"
                className={confidenceBadgeClass(issue.confidence)}
              >
                {confidenceLabel(issue.confidence)}
              </Badge>
              <CardTitle className="text-base">{issue.issue_name}</CardTitle>
            </div>
            {(issue.file_path || issue.line_number) && (
              <p className="font-mono text-xs text-muted-foreground">
                {issue.file_path}
                {issue.line_number ? `:${issue.line_number}` : ""}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{issue.description}</p>

        {issue.evidence && (
          <div>
            <button
              type="button"
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2 text-sm font-medium hover:bg-muted/40"
            >
              <span>Code Evidence</span>
              {evidenceExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {evidenceExpanded && (
              <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
                {issue.evidence}
              </pre>
            )}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setFixExpanded(!fixExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            <span>Fix Prompt</span>
            {fixExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {fixExpanded && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste this into {tool}
              </p>
              <pre className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                {issue.fix_prompt}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy Fix Prompt
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
