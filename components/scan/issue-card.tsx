"use client";

import { ChevronDown, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SqlFixDisplay } from "@/components/scan/sql-fix-display";
import { formatAllSteps, formatStepText } from "@/lib/scan/fix-parser";
import {
  extractTerminalCommand,
  getCopyButtonLabel,
  getMultiStepIntro,
} from "@/lib/scan/fix-type-utils";
import { extractStackSummaryFromDiscovery } from "@/lib/scan/discovery-parser";
import {
  SKIP_REASON_LABELS,
  type SkipReason,
} from "@/lib/scan/skipped-issues";
import { cn } from "@/lib/utils";
import type { Confidence, FixStep, FixType, ScanIssueRow, Tool } from "@/types";

interface IssueCardProps {
  issue: ScanIssueRow;
  tool: Tool;
  discoveryResponse?: string | null;
  isFixed?: boolean;
  onToggleFixed?: () => void;
  isSkipped?: boolean;
  skipReason?: SkipReason | null;
  onSkip?: (reason: SkipReason) => void;
  onUnskip?: () => void;
  collapsedByDefault?: boolean;
}

const CODE_BLOCK =
  "max-h-64 overflow-x-auto border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-900";

const COPY_BTN =
  "inline-flex items-center gap-1.5 border border-gray-200 bg-transparent px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800";

const TOGGLE_BTN =
  "text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300";

const SKIP_REASONS: SkipReason[] = ["break", "not_relevant", "later"];

function buildAskToolPrompt(issue: ScanIssueRow, stackSummary: string): string {
  return `I have a security issue in my app:
${issue.issue_name}: ${issue.description}
My stack: ${stackSummary}
Please fix this issue in my codebase without breaking my existing setup.`;
}

function confidenceInline(confidence?: Confidence): string {
  if (confidence === "high") return "high confidence";
  if (confidence === "low") return "low confidence";
  return "medium confidence";
}

function getSeverityBorder(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "border-l-[3px] border-red-400";
  if (s === "warning") return "border-l-[3px] border-amber-400";
  return "border-l-[3px] border-gray-300 dark:border-gray-600";
}

function getSeverityDot(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "bg-red-400";
  if (s === "warning") return "bg-amber-400";
  return "bg-gray-400";
}

function getSeverityText(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "text-red-500 dark:text-red-400";
  if (s === "warning") return "text-amber-600 dark:text-amber-400";
  return "text-gray-400";
}

function resolveFixType(issue: ScanIssueRow, step?: FixStep): FixType {
  if (step?.fixType) return step.fixType;
  return issue.fix_type ?? "cursor";
}

async function copyText(text: string, successMessage: string) {
  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
}

function UncertainFixNotice() {
  return (
    <div className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      <p className="font-medium">⚠️ Verify before applying</p>
      <p className="mt-0.5">
        This fix may behave differently depending on your exact setup. We
        recommend pasting this into your AI tool rather than applying manually.
      </p>
    </div>
  );
}

function CopyButton({
  onClick,
  copied,
  label,
}: {
  onClick: () => void;
  copied: boolean;
  label: string;
}) {
  return (
    <button type="button" className={COPY_BTN} onClick={onClick}>
      {copied ? (
        <>
          <Check className="size-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          {label}
        </>
      )}
    </button>
  );
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
    return <pre className={CODE_BLOCK}>{fixPrompt}</pre>;
  }

  return (
    <div className="space-y-3">
      {explanation ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{explanation}</p>
      ) : null}
      <pre className={CODE_BLOCK}>{command}</pre>
      <CopyButton
        onClick={() => onCopyCommand(command)}
        copied={copied}
        label="Copy command"
      />
    </div>
  );
}

export function IssueCard({
  issue,
  tool,
  discoveryResponse,
  isFixed = false,
  onToggleFixed,
  isSkipped = false,
  skipReason = null,
  onSkip,
  onUnskip,
  collapsedByDefault = false,
}: IssueCardProps) {
  const stackSummary = extractStackSummaryFromDiscovery(discoveryResponse, tool);
  const [cardExpanded, setCardExpanded] = useState(!collapsedByDefault);
  const [fixExpanded, setFixExpanded] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const [selectedSkipReason, setSelectedSkipReason] =
    useState<SkipReason>("break");
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
  const severityKey = issue.severity.toLowerCase();

  useEffect(() => {
    if (isFixed) setFixExpanded(false);
  }, [isFixed]);

  useEffect(() => {
    if (isSkipped) {
      setShowSkipMenu(false);
      setFixExpanded(false);
    }
  }, [isSkipped]);

  const handleCopy = async (
    text: string,
    message: string,
    setCopied: (v: boolean) => void
  ) => {
    try {
      await copyText(text, message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSkipConfirm = () => {
    onSkip?.(selectedSkipReason);
    setShowSkipMenu(false);
  };

  if (isSkipped && !cardExpanded) {
    return (
      <article className="border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-transparent">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setCardExpanded(true)}
        >
          <div className="min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Skipped
            </span>
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              {issue.issue_name}
            </p>
            {skipReason ? (
              <p className="mt-0.5 text-xs text-gray-400">
                {SKIP_REASON_LABELS[skipReason]}
              </p>
            ) : null}
          </div>
          <ChevronDown className="size-4 shrink-0 text-gray-400" />
        </button>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-transparent",
        !isFixed && !isSkipped && getSeverityBorder(issue.severity),
        isFixed && "border-l-[3px] border-gray-300 opacity-60 dark:border-gray-600",
        isSkipped && "border-l-[3px] border-gray-300 opacity-70 dark:border-gray-600"
      )}
    >
      {isSkipped ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Skipped
          </span>
          <button
            type="button"
            className={TOGGLE_BTN}
            onClick={() => setCardExpanded(false)}
          >
            Collapse
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {!isSkipped ? (
          <span
            className={cn("size-2 shrink-0 rounded-full", getSeverityDot(issue.severity))}
          />
        ) : null}
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            isSkipped ? "text-gray-400" : getSeverityText(issue.severity)
          )}
        >
          {isSkipped ? "skipped" : severityKey}
        </span>
        <span
          className={cn(
            "text-sm font-semibold text-gray-900 dark:text-gray-100",
            isFixed && "text-gray-400 line-through dark:text-gray-500",
            isSkipped && "text-gray-500 dark:text-gray-400"
          )}
        >
          {issue.issue_name}
        </span>
        {!isSkipped ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            · {confidenceInline(issue.confidence)}
          </span>
        ) : null}
      </div>

      {(issue.file_path || issue.line_number) && (
        <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">
          {issue.file_path}
          {issue.line_number ? `:${issue.line_number}` : ""}
        </p>
      )}

      <p className="mt-2 text-sm font-normal text-gray-600 dark:text-gray-400">
        {issue.description}
      </p>

      {issue.evidence ? (
        <div className="mt-3">
          <button
            type="button"
            className={TOGGLE_BTN}
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          >
            {evidenceExpanded ? "Hide code evidence ↑" : "Show code evidence ↓"}
          </button>
          {evidenceExpanded ? (
            <pre className={cn(CODE_BLOCK, "mt-2 max-h-32")}>{issue.evidence}</pre>
          ) : null}
        </div>
      ) : null}

      {!isFixed && !isSkipped ? (
        <div className="mt-3">
          <button
            type="button"
            className={TOGGLE_BTN}
            onClick={() => setFixExpanded(!fixExpanded)}
          >
            {fixExpanded ? "Hide fix prompt ↑" : "Show fix prompt ↓"}
          </button>

          {fixExpanded ? (
            <div className="mt-3 space-y-4">
              {isUncertainFix ? <UncertainFixNotice /> : null}
              {isMultiStep ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getMultiStepIntro(
                      steps.map((step) => resolveFixType(issue, step)),
                      tool
                    )}
                  </p>
                  {steps.map((step) => {
                    const stepFixType = resolveFixType(issue, step);
                    const stepTerminal = stepFixType === "terminal";
                    const stepParsed = stepTerminal
                      ? extractTerminalCommand(step.instruction)
                      : null;

                    return (
                      <div
                        key={step.stepNumber}
                        className="border-t border-gray-100 pt-3 dark:border-gray-800"
                      >
                        <p className="mb-2 text-xs text-gray-500">
                          Step {step.stepNumber} ·{" "}
                          <span className="font-mono">{step.filePath}</span>
                        </p>
                        {stepTerminal && stepParsed?.command ? (
                          <TerminalFixDisplay
                            fixPrompt={step.instruction}
                            copied={!!copiedStepCommands[step.stepNumber]}
                            onCopyCommand={(command) =>
                              handleCopy(
                                command,
                                "Command copied",
                                (v) =>
                                  setCopiedStepCommands((prev) => ({
                                    ...prev,
                                    [step.stepNumber]: v,
                                  }))
                              )
                            }
                          />
                        ) : (
                          <>
                            <pre className={CODE_BLOCK}>{step.instruction}</pre>
                            <div className="mt-2">
                              <CopyButton
                                onClick={() =>
                                  handleCopy(
                                    formatStepText(step),
                                    "Copied to clipboard",
                                    (v) =>
                                      setCopiedSteps((prev) => ({
                                        ...prev,
                                        [step.stepNumber]: v,
                                      }))
                                  )
                                }
                                copied={!!copiedSteps[step.stepNumber]}
                                label={getCopyButtonLabel(stepFixType, tool)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <CopyButton
                    onClick={() =>
                      handleCopy(formatAllSteps(steps), "All steps copied", setCopiedAll)
                    }
                    copied={copiedAll}
                    label="Copy all steps"
                  />
                  {isUncertainFix ? (
                    <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <CopyButton
                        onClick={() =>
                          handleCopy(
                            buildAskToolPrompt(issue, stackSummary),
                            `Prompt copied for ${tool}`,
                            setCopiedAskTool
                          )
                        }
                        copied={copiedAskTool}
                        label={`Ask ${tool} to fix this`}
                      />
                    </div>
                  ) : null}
                </>
              ) : singleFixType === "sql" ? (
                <SqlFixDisplay issue={issue} tool={tool} />
              ) : singleFixType === "terminal" &&
                extractTerminalCommand(issue.fix_prompt).command ? (
                <TerminalFixDisplay
                  fixPrompt={issue.fix_prompt}
                  copied={copiedCommand}
                  onCopyCommand={(command) =>
                    handleCopy(command, "Command copied", setCopiedCommand)
                  }
                />
              ) : (
                <>
                  <pre className={CODE_BLOCK}>{issue.fix_prompt}</pre>
                  {isUncertainFix ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <CopyButton
                        onClick={() =>
                          handleCopy(issue.fix_prompt, "Fix prompt copied", setCopiedSingle)
                        }
                        copied={copiedSingle}
                        label="Copy fix prompt"
                      />
                      <CopyButton
                        onClick={() =>
                          handleCopy(
                            buildAskToolPrompt(issue, stackSummary),
                            `Prompt copied for ${tool}`,
                            setCopiedAskTool
                          )
                        }
                        copied={copiedAskTool}
                        label={`Ask ${tool} to fix this`}
                      />
                    </div>
                  ) : (
                    <CopyButton
                      onClick={() =>
                        handleCopy(
                          issue.fix_prompt,
                          `${getCopyButtonLabel(singleFixType, tool)} copied`,
                          setCopiedSingle
                        )
                      }
                      copied={copiedSingle}
                      label={getCopyButtonLabel(singleFixType, tool)}
                    />
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isSkipped && onToggleFixed ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={isFixed}
              onChange={onToggleFixed}
              className="size-3.5 rounded border-gray-300 dark:border-gray-600"
            />
            {isFixed ? "Fixed" : "Mark as fixed"}
          </label>

          {onSkip && !isFixed ? (
            <div className="relative">
              <button
                type="button"
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowSkipMenu((open) => !open)}
              >
                Can&apos;t fix right now →
              </button>

              {showSkipMenu ? (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Why are you skipping this?
                  </p>
                  <div className="mt-2 space-y-2">
                    {SKIP_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <input
                          type="radio"
                          name={`skip-reason-${issue.id}`}
                          checked={selectedSkipReason === reason}
                          onChange={() => setSelectedSkipReason(reason)}
                          className="size-3.5"
                        />
                        {SKIP_REASON_LABELS[reason]}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 text-xs font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100"
                    onClick={handleSkipConfirm}
                  >
                    Skip this issue
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {isSkipped && onUnskip ? (
        <button
          type="button"
          className="mt-4 text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={onUnskip}
        >
          Un-skip this issue
        </button>
      ) : null}
    </article>
  );
}
