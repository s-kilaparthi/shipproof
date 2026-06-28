"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DiscoveryPrompt } from "@/components/scan/discovery-prompt";
import { RepoSelector } from "@/components/scan/repo-selector";
import { ScanLoading } from "@/components/scan/scan-loading";
import { ToolSelector } from "@/components/scan/tool-selector";
import { cn } from "@/lib/utils";
import {
  SCAN_STEPS,
  type AnalyzeScanResponse,
  type CreateScanResponse,
  type GitHubRepo,
  type ScanFormState,
  type ScanHistoryResponse,
  type ScanStep,
  type Tool,
} from "@/types";

function StepIndicator({ currentStep }: { currentStep: ScanStep }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-3 sm:hidden">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {SCAN_STEPS.length}
        </p>
        <p className="font-medium">
          {SCAN_STEPS.find((s) => s.step === currentStep)?.label}
        </p>
      </div>

      <div className="hidden items-center justify-center gap-2 sm:flex">
        {SCAN_STEPS.map((step, index) => {
          const isActive = step.step === currentStep;
          const isComplete = step.step < currentStep;

          return (
            <div key={step.step} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && "bg-primary/20 text-primary",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}
                >
                  {step.step}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < SCAN_STEPS.length - 1 && (
                <span className="mx-1 text-muted-foreground">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatScanDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ScanWizard() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<ScanStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previousScan, setPreviousScan] = useState<ScanHistoryResponse | null>(
    null
  );
  const [formState, setFormState] = useState<ScanFormState>({
    selectedRepo: null,
    selectedTool: null,
    discoveryResponse: "",
    domain: "",
    scanId: null,
  });

  useEffect(() => {
    if (!formState.selectedRepo) {
      setPreviousScan(null);
      return;
    }

    let cancelled = false;

    fetch(
      `/api/scan/history?repo_name=${encodeURIComponent(formState.selectedRepo.full_name)}`
    )
      .then((res) => res.json())
      .then((data: ScanHistoryResponse) => {
        if (!cancelled) setPreviousScan(data);
      })
      .catch(() => {
        if (!cancelled) setPreviousScan({ hasPreviousScan: false });
      });

    return () => {
      cancelled = true;
    };
  }, [formState.selectedRepo]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setFormState((prev) => ({ ...prev, selectedRepo: repo }));
  };

  const handleToolSelect = (tool: Tool) => {
    setFormState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleStartScan = async () => {
    if (!formState.selectedRepo || !formState.selectedTool) return;

    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      const createResponse = await fetch("/api/scan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: formState.selectedRepo.full_name,
          repo_url: formState.selectedRepo.html_url,
          tool_selected: formState.selectedTool,
          discovery_response: formState.discoveryResponse,
          domain: formState.domain || undefined,
        }),
      });

      const createData = (await createResponse.json()) as CreateScanResponse & {
        error?: string;
        details?: string;
      };

      if (!createResponse.ok) {
        throw new Error(
          [createData.error, createData.details].filter(Boolean).join(" — ") ||
            "Failed to create scan"
        );
      }

      const analyzeResponse = await fetch("/api/scan/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: createData.id }),
      });

      const analyzeData = (await analyzeResponse.json()) as AnalyzeScanResponse & {
        error?: string;
        details?: string;
      };

      if (!analyzeResponse.ok) {
        throw new Error(
          [analyzeData.error, analyzeData.details].filter(Boolean).join(" — ") ||
            "Failed to analyze scan"
        );
      }

      toast.success(
        `Scan complete — score ${analyzeData.overall_score ?? "N/A"}, ${analyzeData.issues_count ?? 0} issue${analyzeData.issues_count === 1 ? "" : "s"}`
      );

      router.push(`/scan/${analyzeData.scan_id}/report`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start scan"
      );
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <ScanLoading isActive={isAnalyzing} />

      <div>
        <StepIndicator currentStep={currentStep} />

        {currentStep === 3 &&
          previousScan?.hasPreviousScan &&
          previousScan.createdAt != null && (
            <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              You scanned this repo on {formatScanDate(previousScan.createdAt)}{" "}
              and found {previousScan.issueCount ?? 0} issue
              {previousScan.issueCount === 1 ? "" : "s"}. Continue to run a
              fresh scan.
            </div>
          )}

        <div className="relative overflow-hidden">
          <div key={currentStep} className="transition-all duration-300 ease-out">
            {currentStep === 1 && (
              <RepoSelector
                selectedRepo={formState.selectedRepo}
                domain={formState.domain}
                onSelect={handleRepoSelect}
                onDomainChange={(domain) =>
                  setFormState((prev) => ({ ...prev, domain }))
                }
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <ToolSelector
                selectedTool={formState.selectedTool}
                onSelect={handleToolSelect}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && formState.selectedTool && (
              <DiscoveryPrompt
                selectedTool={formState.selectedTool}
                discoveryResponse={formState.discoveryResponse}
                onResponseChange={(value) =>
                  setFormState((prev) => ({ ...prev, discoveryResponse: value }))
                }
                onSubmit={handleStartScan}
                onBack={() => setCurrentStep(2)}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
