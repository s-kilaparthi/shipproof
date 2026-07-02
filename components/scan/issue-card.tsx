"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Code,
  Copy,
  Database,
  Settings,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SqlFixDisplay } from "@/components/scan/sql-fix-display";
import { formatAllSteps, formatStepText } from "@/lib/scan/fix-parser";
import {
  extractTerminalCommand,
  getCopyButtonLabel,
  getFixTypeBadgeClass,
  getFixTypeBadgeLabel,
  getMultiStepIntro,
} from "@/lib/scan/fix-type-utils";
import { extractStackSummaryFromDiscovery } from "@/lib/scan/discovery-parser";
import { getSeverityColor } from "@/lib/scan/health-score";
import { cn } from "@/lib/utils";
import type { Confidence, FixStep, FixType, ScanIssueRow, Tool } from "@/types";

interface IssueCardProps {
  issue: ScanIssueRow;
  tool: Tool;
  discoveryResponse?: string | null;
  isFixed?: boolean;
  onToggleFixed?: () => void;
}

function buildAskToolPrompt(
  issue: ScanIssueRow,
  stackSummary: string
): string {
  return `I have a security issue in my app:
${issue.issue_name}: ${issue.description}
My stack: ${stackSummary}
Please fix this issue in my codebase without breaking my existing setup.`;
}

function confidenceLabel(confidence?: Confidence): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "low") return "Low Confidence";
  return "Medium Confidence";
}

function confidenceBadgeClass(confidence?: Confidence): string {
  if (confidence === "high") return "bg-green-100 text-green-700 border-green-200";
  if (confidence === "low") return "bg-muted text-muted-foreground border-border";
  return "border border-border bg-muted text-muted-foreground";
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

function TerminalFixDisplay({
  fixPrompt,
  copied,
  onCopyCommand,
}: {
  fixPrompt: string;
  copied: boolean;
  onCopyCommand: (command: string) => void;
}) {
  const { explanation, command } = extractTerminalCommand(fixPrompt);

  if (!command) {
    return (
      <pre className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
        {fixPrompt}
      </pre>
    );
  }

  return (
    <div className="space-y-4">
      {explanation ? (
        <div>
          <p className="text-xs font-medium text-foreground">What this does:</p>
          <p className="mt-1 text-sm text-muted-foreground">{explanation}</p>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-foreground">Run this command:</p>
        <div className="mt-2 overflow-hidden rounded-lg bg-black dark:bg-gray-950">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="size-2.5 rounded-full bg-red-500" aria-hidden />
            <span className="size-2.5 rounded-full bg-amber-500" aria-hidden />
            <span className="size-2.5 rounded-full bg-green-500" aria-hidden />
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-sm text-green-400">
            {command}
          </pre>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 gap-2"
          onClick={() => onCopyCommand(command)}
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy Command
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function IssueCard({
  issue,
  tool,
  discoveryResponse,
  isFixed = false,
  onToggleFixed,
}: IssueCardProps) {
  const stackSummary = extractStackSummaryFromDiscovery(discoveryResponse, tool);
  const [fixExpanded, setFixExpanded] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedAskTool, setCopiedAskTool] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedSteps, setCopiedSteps] = useState<Record<number, boolean>>({});
  const [copiedStepCommands, setCopiedStepCommands] = useState<
    Record<number, boolean>
  >({});

  const isMultiStep = issue.is_multi_step && (issue.fix_steps?.length ?? 0) >= 2;
  const steps = issue.fix_steps ?? [];
  const singleFixType = resolveFixType(issue);
  const isUncertainFix = issue.fix_confidence === "uncertain";

  useEffect(() => {
    if (isFixed) {
      setFixExpanded(false);
    }
  }, [isFixed]);

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

  const handleCopyCommand = async (command: string) => {
    try {
      await copyText(command, "Command copied to clipboard");
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyStepCommand = async (stepNumber: number, command: string) => {
    try {
      await copyText(command, "Command copied to clipboard");
      setCopiedStepCommands((prev) => ({ ...prev, [stepNumber]: true }));
      setTimeout(
        () => setCopiedStepCommands((prev) => ({ ...prev, [stepNumber]: false })),
        2000
      );
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

  const handleCopyAskTool = async () => {
    try {
      await copyText(
        buildAskToolPrompt(issue, stackSummary),
        `Ask ${tool} prompt copied to clipboard`
      );
      setCopiedAskTool(true);
      setTimeout(() => setCopiedAskTool(false), 2000);
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
    <Card
      className={cn(
        isFixed && "border-l-4 border-green-500 opacity-75"
      )}
    >
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
              <CardTitle
                className={cn(
                  "text-base text-foreground",
                  isFixed && "line-through"
                )}
              >
                {issue.issue_name}
              </CardTitle>
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

        {!isFixed ? (
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
                      const stepCommandCopied = copiedStepCommands[step.stepNumber];
                      const stepTerminal = stepFixType === "terminal";
                      const stepParsed = stepTerminal
                        ? extractTerminalCommand(step.instruction)
                        : null;

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
                          {stepTerminal && stepParsed?.command ? (
                            <TerminalFixDisplay
                              fixPrompt={step.instruction}
                              copied={!!stepCommandCopied}
                              onCopyCommand={(command) =>
                                handleCopyStepCommand(step.stepNumber, command)
                              }
                            />
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">
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

                  {isUncertainFix ? (
                    <div className="space-y-3 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        We&apos;re not 100% certain about this fix for your exact
                        setup. We recommend asking your AI tool directly.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        onClick={handleCopyAskTool}
                      >
                        {copiedAskTool ? (
                          <>
                            <Check className="size-4" />
                            Copied
                          </>
                        ) : (
                          <>Ask {tool} to fix this</>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <FixTypeBadge fixType={singleFixType} />
                  {singleFixType === "sql" ? (
                    <SqlFixDisplay issue={issue} tool={tool} />
                  ) : singleFixType === "terminal" &&
                  extractTerminalCommand(issue.fix_prompt).command ? (
                    <TerminalFixDisplay
                      fixPrompt={issue.fix_prompt}
                      copied={copiedCommand}
                      onCopyCommand={handleCopyCommand}
                    />
                  ) : (
                    <>
                      <pre className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                        {issue.fix_prompt}
                      </pre>
                      {isUncertainFix ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            We&apos;re not 100% certain about this fix for your
                            exact setup. We recommend asking your AI tool directly.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row">
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
                                  Copy Fix Prompt
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-2"
                              onClick={handleCopyAskTool}
                            >
                              {copiedAskTool ? (
                                <>
                                  <Check className="size-4" />
                                  Copied
                                </>
                              ) : (
                                <>Ask {tool} to fix this</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
          </div>
        ) : null}

        {onToggleFixed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              isFixed && "border-green-200 text-green-600 dark:border-green-800"
            )}
            onClick={onToggleFixed}
          >
            {isFixed ? (
              <>
                <Check className="size-4" />
                ✓ Fixed — Undo
              </>
            ) : (
              <>
                <Circle className="size-4" />
                Mark as Fixed
              </>
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
