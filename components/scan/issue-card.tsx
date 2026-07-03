"use client";

import Link from "next/link";
import { ChevronDown, Check, Copy, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SqlFixDisplay } from "@/components/scan/sql-fix-display";
import { Button } from "@/components/ui/button";
import { formatAllSteps, formatStepText } from "@/lib/scan/fix-parser";
import {
  extractTerminalCommand,
  getCopyButtonLabel,
  getMultiStepIntro,
} from "@/lib/scan/fix-type-utils";
import {
  SKIP_REASON_LABELS,
  type SkipReason,
} from "@/lib/scan/skipped-issues";
import { cn } from "@/lib/utils";
import {
  ALL_PILLARS,
  type Confidence,
  type FixStep,
  type FixType,
  type ScanIssueRow,
  type Tool,
} from "@/types";

interface IssueCardProps {
  issue: ScanIssueRow;
  tool: Tool;
  isFixed?: boolean;
  onToggleFixed?: () => void;
  isSkipped?: boolean;
  skipReason?: SkipReason | null;
  onSkip?: (reason: SkipReason) => void;
  onUnskip?: () => void;
  collapsedByDefault?: boolean;
  fixedBadgeLabel?: string;
  issueNote?: string;
  readOnly?: boolean;
  /** Free-tier limited report: lock non-preview issues */
  isLimited?: boolean;
}

const CARD_CLASS =
  "rounded-xl border border-gray-900 bg-white p-4 dark:border-gray-800 dark:bg-gray-900";

const CODE_BLOCK =
  "max-h-64 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-950";

const COPY_BTN =
  "inline-flex items-center gap-1.5 rounded border border-gray-200 bg-transparent px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800";

const FIX_PROMPT_BTN =
  "rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

const SKIP_REASONS: SkipReason[] = ["break", "not_relevant", "later"];

const PILLAR_LABELS = Object.fromEntries(
  ALL_PILLARS.map(({ id, label }) => [id, label])
) as Record<string, string>;

function buildStackSummary(tool?: Tool | null): string {
  return tool ? `Built with ${tool}` : "Stack unknown";
}

function buildAskToolPrompt(issue: ScanIssueRow, tool?: Tool | null): string {
  return `I have a security issue in my app:
${issue.issue_name}: ${issue.description}
${buildStackSummary(tool)}
Please fix this issue in my codebase without breaking my existing setup.`;
}

function confidenceTooltip(confidence?: Confidence): string {
  if (confidence === "high") return "High confidence — based on clear code evidence";
  if (confidence === "low") return "Low confidence — inferred from context";
  return "Medium confidence — based on file or function references";
}

function formatSeverityLabel(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "Critical";
  if (s === "warning") return "Warning";
  return "Info";
}

function getSeverityDot(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "bg-red-500";
  if (s === "warning") return "bg-amber-500";
  return "bg-gray-500";
}

function getSeverityText(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "text-red-500";
  if (s === "warning") return "text-amber-500";
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

function UncertainFixBanner({ tool }: { tool: Tool }) {
  return (
    <div className="mb-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      <div>
        <p className="font-medium">
          ⚠️ We don&apos;t have a guaranteed fix for this
        </p>
        <p className="mt-0.5">
          Every app&apos;s setup is different, so we can&apos;t provide a
          one-size-fits-all solution. Instead, paste the prompt below into {tool}{" "}
          — it will analyse your exact codebase and fix it safely.
        </p>
      </div>
    </div>
  );
}

function PrimaryCopyButton({
  onClick,
  copied,
  tool,
}: {
  onClick: () => void;
  copied: boolean;
  tool: Tool;
}) {
  return (
    <button
      type="button"
      className="mt-2 inline-flex items-center gap-1.5 rounded bg-black px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
      onClick={onClick}
    >
      {copied ? (
        <>
          <Check className="size-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy prompt → paste into {tool}
        </>
      )}
    </button>
  );
}

function SecondaryCopyButton({
  onClick,
  copied,
  label = "Copy fix prompt",
}: {
  onClick: () => void;
  copied: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      onClick={onClick}
    >
      {copied ? "Copied" : label}
    </button>
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
  isFixed = false,
  onToggleFixed,
  isSkipped = false,
  skipReason = null,
  onSkip,
  onUnskip,
  collapsedByDefault = false,
  fixedBadgeLabel,
  issueNote,
  readOnly = false,
  isLimited = false,
}: IssueCardProps) {
  const isFreePreview = isLimited && issue.is_free_preview === true;
  const isLocked = isLimited && !isFreePreview;
  const askToolPrompt = buildAskToolPrompt(issue, tool);
  const [cardExpanded, setCardExpanded] = useState(!collapsedByDefault);
  const [fixExpanded, setFixExpanded] = useState(isFreePreview);
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
  const [secondaryFixExpanded, setSecondaryFixExpanded] = useState(false);

  const isMultiStep = issue.is_multi_step && (issue.fix_steps?.length ?? 0) >= 2;
  const steps = issue.fix_steps ?? [];
  const singleFixType = resolveFixType(issue);
  // Free preview always shows the clean certain-fix UI (no uncertain banners).
  const isUncertainFix =
    !isFreePreview && issue.fix_confidence === "uncertain";
  const severityLabel = formatSeverityLabel(issue.severity);
  const pillarLabel = PILLAR_LABELS[issue.pillar] ?? issue.pillar;

  useEffect(() => {
    if (isFixed) {
      setFixExpanded(false);
      setSecondaryFixExpanded(false);
    }
  }, [isFixed]);

  useEffect(() => {
    if (isSkipped) {
      setShowSkipMenu(false);
      setFixExpanded(false);
      setSecondaryFixExpanded(false);
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

  const renderCertainFixContent = () => {
    if (isMultiStep) {
      return (
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
        </>
      );
    }

    if (singleFixType === "sql") {
      return <SqlFixDisplay issue={issue} tool={tool} />;
    }

    if (
      singleFixType === "terminal" &&
      extractTerminalCommand(issue.fix_prompt).command
    ) {
      return (
        <TerminalFixDisplay
          fixPrompt={issue.fix_prompt}
          copied={copiedCommand}
          onCopyCommand={(command) =>
            handleCopy(command, "Command copied", setCopiedCommand)
          }
        />
      );
    }

    return (
      <>
        <pre className={CODE_BLOCK}>{issue.fix_prompt}</pre>
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
      </>
    );
  };

  const renderSecondaryFixContent = () => {
    if (isMultiStep) {
      return (
        <div className="space-y-3">
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
            const stepCommand = stepParsed?.command ?? null;

            return (
              <div
                key={step.stepNumber}
                className="border-t border-gray-100 pt-3 dark:border-gray-800"
              >
                <p className="mb-2 text-xs text-gray-500">
                  Step {step.stepNumber} ·{" "}
                  <span className="font-mono">{step.filePath}</span>
                </p>
                {stepTerminal && stepCommand ? (
                  <>
                    <pre className={CODE_BLOCK}>{stepCommand}</pre>
                    <div className="mt-2">
                      <SecondaryCopyButton
                        onClick={() =>
                          handleCopy(
                            stepCommand,
                            "Command copied",
                            (v) =>
                              setCopiedStepCommands((prev) => ({
                                ...prev,
                                [step.stepNumber]: v,
                              }))
                          )
                        }
                        copied={!!copiedStepCommands[step.stepNumber]}
                        label="Copy command"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <pre className={CODE_BLOCK}>{step.instruction}</pre>
                    <div className="mt-2">
                      <SecondaryCopyButton
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
                        label="Copy fix prompt"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <SecondaryCopyButton
            onClick={() =>
              handleCopy(formatAllSteps(steps), "All steps copied", setCopiedAll)
            }
            copied={copiedAll}
            label="Copy all steps"
          />
        </div>
      );
    }

    if (singleFixType === "sql") {
      return <SqlFixDisplay issue={issue} tool={tool} />;
    }

    if (
      singleFixType === "terminal" &&
      extractTerminalCommand(issue.fix_prompt).command
    ) {
      const { command } = extractTerminalCommand(issue.fix_prompt);
      return (
        <>
          <pre className={CODE_BLOCK}>{command ?? issue.fix_prompt}</pre>
          {command ? (
            <div className="mt-2">
              <SecondaryCopyButton
                onClick={() =>
                  handleCopy(command, "Command copied", setCopiedCommand)
                }
                copied={copiedCommand}
                label="Copy command"
              />
            </div>
          ) : null}
        </>
      );
    }

    return (
      <>
        <pre className={CODE_BLOCK}>{issue.fix_prompt}</pre>
        <div className="mt-2">
          <SecondaryCopyButton
            onClick={() =>
              handleCopy(issue.fix_prompt, "Fix prompt copied", setCopiedSingle)
            }
            copied={copiedSingle}
          />
        </div>
      </>
    );
  };

  const renderUncertainFixContent = () => (
    <>
      <UncertainFixBanner tool={tool} />

      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Paste this into {tool}:
        </p>
        <pre className="mt-2 max-h-64 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-950">
          {askToolPrompt}
        </pre>
        <PrimaryCopyButton
          tool={tool}
          copied={copiedAskTool}
          onClick={() =>
            handleCopy(
              askToolPrompt,
              `Prompt copied for ${tool}`,
              setCopiedAskTool
            )
          }
        />
      </div>

      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Or if you know what you&apos;re doing:
        </p>
        <button
          type="button"
          className="mt-1 text-xs text-gray-400 underline-offset-2 hover:underline"
          onClick={() => setSecondaryFixExpanded((open) => !open)}
        >
          {secondaryFixExpanded ? "Hide fix prompt ↑" : "Show fix prompt ▼"}
        </button>
        {secondaryFixExpanded ? (
          <div className="mt-3">{renderSecondaryFixContent()}</div>
        ) : null}
      </div>
    </>
  );

  if (isLocked) {
    const severity = issue.severity.toLowerCase();
    const lockedMessage =
      severity === "critical"
        ? "Needs immediate attention"
        : severity === "warning"
          ? "Recommended fix available"
          : "Improvement available";

    return (
      <article className={cn(CARD_CLASS, "flex items-center justify-between gap-4")}>
        <div className="min-w-0 flex items-start gap-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  getSeverityText(issue.severity)
                )}
              >
                {severityLabel}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{pillarLabel}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {lockedMessage}
            </p>
          </div>
        </div>
        <Link href="/pricing" className="shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-gray-900 px-3 text-xs dark:border-gray-100"
          >
            Unlock
          </Button>
        </Link>
      </article>
    );
  }

  if (isSkipped && !cardExpanded) {
    return (
      <article className={cn(CARD_CLASS, "opacity-70")}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setCardExpanded(true)}
        >
          <div className="min-w-0">
            <span className="text-xs text-gray-400">Skipped</span>
            <p className="mt-1 truncate text-base font-semibold text-gray-500 dark:text-gray-400">
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
        CARD_CLASS,
        isFixed && "opacity-60",
        isSkipped && "opacity-70"
      )}
    >
      {isSkipped ? (
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Skipped</span>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setCardExpanded(false)}
          >
            Collapse
          </button>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center gap-2"
        title={confidenceTooltip(issue.confidence)}
      >
        {!isSkipped ? (
          <>
            <span
              className={cn("size-2 shrink-0 rounded-full", getSeverityDot(issue.severity))}
            />
            <span
              className={cn("text-xs font-medium", getSeverityText(issue.severity))}
            >
              {severityLabel}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">{pillarLabel}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Skipped</span>
        )}
      </div>

      <h3
        className={cn(
          "mt-1 text-base font-semibold text-gray-900 dark:text-white",
          isFixed && "text-gray-400 line-through dark:text-gray-500"
        )}
      >
        {issue.issue_name}
      </h3>

      {isFixed && fixedBadgeLabel ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
          <Check className="size-3" strokeWidth={3} />
          {fixedBadgeLabel}
        </p>
      ) : null}

      {(issue.file_path || issue.line_number) && (
        <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">
          {issue.file_path}
          {issue.line_number ? `:${issue.line_number}` : ""}
        </p>
      )}

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {issue.description}
      </p>

      {issueNote ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          {issueNote}
        </p>
      ) : null}

      {issue.evidence ? (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-gray-400 underline-offset-2 hover:underline"
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          >
            {evidenceExpanded ? "Hide code evidence ↑" : "Show code evidence ↓"}
          </button>
          {evidenceExpanded ? (
            <pre className={cn(CODE_BLOCK, "mt-2 max-h-32")}>{issue.evidence}</pre>
          ) : null}
        </div>
      ) : null}

      {!isFixed && !isSkipped && !readOnly ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={cn(
                FIX_PROMPT_BTN,
                fixExpanded && "bg-gray-50 dark:bg-gray-800"
              )}
              onClick={() => setFixExpanded(!fixExpanded)}
            >
              {fixExpanded ? "Hide fix prompt" : "Fix Prompt"}
            </button>

            {onToggleFixed ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={onToggleFixed}
                  className="size-3.5 rounded border-gray-300 dark:border-gray-600"
                />
                Mark as fixed
              </label>
            ) : null}
          </div>

          {fixExpanded ? (
            <div className="mt-3 space-y-4">
              {isUncertainFix
                ? renderUncertainFixContent()
                : renderCertainFixContent()}
            </div>
          ) : null}

          {onSkip && !isFreePreview ? (
            <div className="relative mt-3 flex justify-end">
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowSkipMenu((open) => !open)}
              >
                Want to skip?
              </button>

              {showSkipMenu ? (
                <div className="absolute bottom-full right-0 z-10 mb-1 w-56 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
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
        </>
      ) : null}

      {isFixed && onToggleFixed && !readOnly ? (
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={isFixed}
            onChange={onToggleFixed}
            className="size-3.5 rounded border-gray-300 dark:border-gray-600"
          />
          Fixed
        </label>
      ) : null}

      {isSkipped && onUnskip ? (
        <button
          type="button"
          className="mt-3 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={onUnskip}
        >
          Un-skip this issue
        </button>
      ) : null}
    </article>
  );
}
