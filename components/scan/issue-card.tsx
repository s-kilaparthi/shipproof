"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Database,
  Settings,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAllSteps, formatStepText } from "@/lib/scan/fix-parser";
import {
  getCopyButtonLabel,
  getFixTypeBadgeClass,
  getFixTypeBadgeLabel,
  getMultiStepIntro,
} from "@/lib/scan/fix-type-utils";
import { getSeverityColor } from "@/lib/scan/health-score";
import type { Confidence, FixStep, FixType, ScanIssueRow, Tool } from "@/types";

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

function resolveFixType(issue: ScanIssueRow, step?: FixStep): FixType {
  if (step?.fixType) return step.fixType;
  return issue.fix_type ?? "cursor";
}

function FixTypeIcon({ fixType }: { fixType: FixType }) {
  switch (fixType) {
    case "sql":
      return <Database className="size-4" />;
    case "terminal":
      return <Terminal className="size-4" />;
    case "manual":
      return <Settings className="size-4" />;
    default:
      return <Code className="size-4" />;
  }
}

function FixTypeBadge({ fixType }: { fixType: FixType }) {
  return (
    <Badge variant="outline" className={getFixTypeBadgeClass(fixType)}>
      {getFixTypeBadgeLabel(fixType)}
    </Badge>
  );
}

async function copyText(text: string, successMessage: string) {
  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
}

export function IssueCard({ issue, tool }: IssueCardProps) {
  const [fixExpanded, setFixExpanded] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedSteps, setCopiedSteps] = useState<Record<number, boolean>>({});

  const isMultiStep = issue.is_multi_step && (issue.fix_steps?.length ?? 0) >= 2;
  const steps = issue.fix_steps ?? [];
  const singleFixType = resolveFixType(issue);

  const handleCopySingle = async () => {
    try {
      await copyText(
        issue.fix_prompt,
        `${getCopyButtonLabel(singleFixType, tool)} copied to clipboard`
      );
      setCopiedSingle(true);
      setTimeout(() => setCopiedSingle(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyStep = async (step: FixStep) => {
    const stepFixType = resolveFixType(issue, step);
    try {
      await copyText(
        formatStepText(step),
        `${getCopyButtonLabel(stepFixType, tool)} copied to clipboard`
      );
      setCopiedSteps((prev) => ({ ...prev, [step.stepNumber]: true }));
      setTimeout(
        () => setCopiedSteps((prev) => ({ ...prev, [step.stepNumber]: false })),
        2000
      );
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyAll = async () => {
    try {
      const combined = formatAllSteps(steps);
      await copyText(combined, "All steps copied to clipboard");
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
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
              {isMultiStep ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {getMultiStepIntro(
                      steps.map((step) => resolveFixType(issue, step)),
                      tool
                    )}
                  </p>

                  <div className="space-y-3">
                    {steps.map((step) => {
                      const stepFixType = resolveFixType(issue, step);
                      const stepCopied = copiedSteps[step.stepNumber];

                      return (
                        <div
                          key={step.stepNumber}
                          className="rounded-lg border border-border bg-muted/20 p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              Step {step.stepNumber}
                            </Badge>
                            <FixTypeBadge fixType={stepFixType} />
                            <span className="font-mono text-xs font-medium">
                              {step.filePath}
                            </span>
                          </div>
                          <pre className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                            {step.instruction}
                          </pre>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2"
                            onClick={() => handleCopyStep(step)}
                          >
                            {stepCopied ? (
                              <>
                                <Check className="size-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <FixTypeIcon fixType={stepFixType} />
                                {getCopyButtonLabel(stepFixType, tool)}
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-amber-700">
                    Complete all steps before rescanning to verify the fix
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy All Steps
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <FixTypeBadge fixType={singleFixType} />
                  <pre className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                    {issue.fix_prompt}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopySingle}
                  >
                    {copiedSingle ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <FixTypeIcon fixType={singleFixType} />
                        {getCopyButtonLabel(singleFixType, tool)}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
