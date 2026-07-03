"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppStageSelector } from "@/components/scan/app-stage-selector";
import { DiscoveryPrompt } from "@/components/scan/discovery-prompt";
import { RepoSelector } from "@/components/scan/repo-selector";
import { RescanModeSelector } from "@/components/scan/rescan-mode-selector";
import { ScanLoading } from "@/components/scan/scan-loading";
import { ToolSelector } from "@/components/scan/tool-selector";
import { formatDiscoveryAgeDays } from "@/lib/scan/discovery-cache";
import { cn } from "@/lib/utils";
import {
  FULL_SCAN_WIZARD_STEPS,
  QUICK_SCAN_WIZARD_STEPS,
  type AnalyzeScanResponse,
  type AppStage,
  type CreateScanResponse,
  type DiscoveryStatusResponse,
  type GitHubRepo,
  type RescanMode,
  type ScanFormState,
  type Tool,
  type WizardStepConfig,
  type WizardStepDisplayId,
  type WizardStepId,
} from "@/types";

function StepIndicator({
  steps,
  currentStepId,
}: {
  steps: WizardStepConfig[];
  currentStepId: WizardStepDisplayId;
}) {
  const displaySteps = steps.filter((s) => s.id !== "report");
  const currentIndex = displaySteps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 sm:hidden">
        <p className="text-sm text-muted-foreground">
          Step {Math.max(1, currentIndex + 1)} of {displaySteps.length}
        </p>
        <p className="font-semibold text-black dark:text-white">
          {displaySteps[currentIndex]?.label ?? "Scanning"}
        </p>
      </div>

      <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
        {displaySteps.map((step, index) => {
          const isActive = step.id === currentStepId;
          const isComplete = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm transition-colors",
                    isActive &&
                      "bg-black font-bold text-white dark:bg-white dark:text-black",
                    isComplete &&
                      "bg-black text-white dark:bg-white dark:text-black",
                    !isActive &&
                      !isComplete &&
                      "bg-gray-200 font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isActive && "font-semibold text-black dark:text-white",
                    isComplete && "text-black dark:text-white",
                    !isActive &&
                      !isComplete &&
                      "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < displaySteps.length - 1 && (
                <span className="mx-1 text-gray-300 dark:text-gray-600">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScanWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRepo = searchParams.get("repo");
  const initialMode = searchParams.get("mode") as RescanMode | null;

  const [currentStepId, setCurrentStepId] = useState<WizardStepId>("repo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] =
    useState<DiscoveryStatusResponse | null>(null);
  const [flowType, setFlowType] = useState<"full" | "quick-choice">("full");
  const [formState, setFormState] = useState<ScanFormState>({
    selectedRepo: null,
    selectedTool: null,
    appStage: null,
    discoveryResponse: "",
    domain: "",
    scanId: null,
    rescanMode: null,
    useCachedDiscovery: false,
    cachedDiscoveryAt: null,
  });
  const urlInitRef = useRef(false);
  const pendingQuickScanRef = useRef<ScanFormState | null>(null);

  const wizardSteps = useMemo(() => {
    if (flowType === "quick-choice" && formState.rescanMode !== "full") {
      return QUICK_SCAN_WIZARD_STEPS;
    }
    return FULL_SCAN_WIZARD_STEPS;
  }, [flowType, formState.rescanMode]);

  const fetchDiscoveryStatus = useCallback(async (repoName: string) => {
    setDiscoveryLoading(true);
    try {
      const res = await fetch(
        `/api/scan/discovery-status?repo_name=${encodeURIComponent(repoName)}`
      );
      const data = (await res.json()) as DiscoveryStatusResponse;
      setDiscoveryStatus(data);
      return data;
    } catch {
      setDiscoveryStatus(null);
      return null;
    } finally {
      setDiscoveryLoading(false);
    }
  }, []);

  const runScan = useCallback(
    async (state: ScanFormState) => {
      if (!state.selectedRepo || !state.selectedTool) return;

      setIsSubmitting(true);
      setIsAnalyzing(true);

      try {
        const createResponse = await fetch("/api/scan/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo_name: state.selectedRepo.full_name,
            repo_url: state.selectedRepo.html_url,
            tool_selected: state.selectedTool,
            discovery_response: state.discoveryResponse,
            domain: state.domain || undefined,
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

        const analyzeBody: Record<string, unknown> = { scan_id: createData.id };

        if (state.useCachedDiscovery) {
          analyzeBody.use_cached_discovery = true;
          analyzeBody.cached_discovery_response = state.discoveryResponse;
          analyzeBody.cached_discovery_at =
            state.cachedDiscoveryAt ?? new Date().toISOString();
        }

        if (state.appStage) {
          analyzeBody.app_stage = state.appStage;
        }

        const analyzeResponse = await fetch("/api/scan/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analyzeBody),
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
        setCurrentStepId(
          state.useCachedDiscovery
            ? "rescan-mode"
            : state.discoveryResponse
              ? "discovery"
              : state.appStage
                ? "app-stage"
                : "tool"
        );
      } finally {
        setIsSubmitting(false);
        setIsAnalyzing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!formState.selectedRepo) {
      setDiscoveryStatus(null);
      return;
    }

    fetchDiscoveryStatus(formState.selectedRepo.full_name);
  }, [formState.selectedRepo, fetchDiscoveryStatus]);

  useEffect(() => {
    if (urlInitRef.current || !initialRepo) return;
    urlInitRef.current = true;

    let cancelled = false;

    fetch("/api/github/repos")
      .then((res) => res.json())
      .then(async (data: { repos?: GitHubRepo[] }) => {
        if (cancelled) return;

        const match = data.repos?.find((r) => r.full_name === initialRepo);
        if (!match) return;

        const status = await fetchDiscoveryStatus(match.full_name);
        if (!status || cancelled) return;

        if (
          initialMode === "quick" &&
          status.hasDiscovery &&
          status.lastDiscoveryResponse &&
          status.tool
        ) {
          const quickState: ScanFormState = {
            selectedRepo: match,
            selectedTool: status.tool as Tool,
            appStage: null,
            discoveryResponse: status.lastDiscoveryResponse,
            domain: "",
            scanId: null,
            rescanMode: "quick",
            useCachedDiscovery: true,
            cachedDiscoveryAt:
              status.lastDiscoveryCachedAt ?? status.lastScanDate,
          };
          setFormState(quickState);
          setFlowType("quick-choice");
          pendingQuickScanRef.current = quickState;
        } else if (initialMode === "full" && status.hasDiscovery) {
          setFormState((prev) => ({
            ...prev,
            selectedRepo: match,
            selectedTool: (status.tool as Tool) ?? prev.selectedTool,
            rescanMode: "full",
          }));
          setCurrentStepId("tool");
        } else {
          setFormState((prev) => ({ ...prev, selectedRepo: match }));
        }
      })
      .catch(() => {
        // user can select repo manually
      });

    return () => {
      cancelled = true;
    };
  }, [initialRepo, initialMode, fetchDiscoveryStatus]);

  useEffect(() => {
    if (pendingQuickScanRef.current) {
      const state = pendingQuickScanRef.current;
      pendingQuickScanRef.current = null;
      runScan(state);
    }
  }, [runScan]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setFormState((prev) => ({
      ...prev,
      selectedRepo: repo,
      appStage: null,
      rescanMode: null,
      useCachedDiscovery: false,
      cachedDiscoveryAt: null,
      discoveryResponse: "",
    }));
    setFlowType("full");
  };

  const handleRepoNext = () => {
    if (!discoveryStatus?.hasDiscovery) {
      setCurrentStepId("tool");
      return;
    }

    setFlowType("quick-choice");
    setCurrentStepId("rescan-mode");
  };

  const handleQuickRescan = async () => {
    if (!formState.selectedRepo || !discoveryStatus?.lastDiscoveryResponse) return;

    const tool = (discoveryStatus.tool as Tool) ?? formState.selectedTool;
    if (!tool) {
      toast.error("Could not determine tool from previous scan");
      return;
    }

    const nextState: ScanFormState = {
      ...formState,
      selectedTool: tool,
      discoveryResponse: discoveryStatus.lastDiscoveryResponse,
      rescanMode: "quick",
      useCachedDiscovery: true,
      cachedDiscoveryAt:
        discoveryStatus.lastDiscoveryCachedAt ??
        discoveryStatus.lastScanDate,
    };

    setFormState(nextState);
    await runScan(nextState);
  };

  const handleFullRescanSelect = () => {
    setFormState((prev) => ({
      ...prev,
      rescanMode: "full",
      appStage: null,
      useCachedDiscovery: false,
      cachedDiscoveryAt: null,
      discoveryResponse: "",
      selectedTool: (discoveryStatus?.tool as Tool) ?? prev.selectedTool,
    }));
    setFlowType("full");
    setCurrentStepId("discovery");
  };

  const handleToolSelect = (tool: Tool) => {
    setFormState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleAppStageSelect = (stage: AppStage) => {
    setFormState((prev) => ({ ...prev, appStage: stage }));
  };

  const handleStartScan = async () => {
    if (!formState.appStage) {
      toast.error("Please select how live your app is");
      setCurrentStepId("app-stage");
      return;
    }
    await runScan(formState);
  };

  const stepIndicatorId: WizardStepDisplayId = isAnalyzing
    ? "scanning"
    : currentStepId;

  return (
    <>
      <ScanLoading isActive={isAnalyzing} />

      <div>
        <StepIndicator steps={wizardSteps} currentStepId={stepIndicatorId} />

        {discoveryLoading && formState.selectedRepo && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking previous scans for this repo...
          </div>
        )}

        <div key={currentStepId} className="transition-all duration-300 ease-out">
            {currentStepId === "repo" && (
              <RepoSelector
                selectedRepo={formState.selectedRepo}
                domain={formState.domain}
                onSelect={handleRepoSelect}
                onDomainChange={(domain) =>
                  setFormState((prev) => ({ ...prev, domain }))
                }
                onNext={handleRepoNext}
              />
            )}

            {currentStepId === "rescan-mode" &&
              discoveryStatus?.hasDiscovery &&
              discoveryStatus.tool && (
                <RescanModeSelector
                  discoveryAgeLabel={
                    discoveryStatus.discoveryAgeLabel ??
                    formatDiscoveryAgeDays(discoveryStatus.discoveryAge)
                  }
                  discoveryAgeDays={discoveryStatus.discoveryAge}
                  tool={discoveryStatus.tool as Tool}
                  onQuickRescan={handleQuickRescan}
                  onFullRescan={handleFullRescanSelect}
                  onBack={() => setCurrentStepId("repo")}
                  isSubmitting={isSubmitting}
                />
              )}

            {currentStepId === "tool" && (
              <ToolSelector
                selectedTool={formState.selectedTool}
                onSelect={handleToolSelect}
                onNext={() => setCurrentStepId("app-stage")}
                onBack={() => {
                  if (
                    flowType === "quick-choice" &&
                    discoveryStatus?.hasDiscovery
                  ) {
                    setCurrentStepId("rescan-mode");
                  } else {
                    setCurrentStepId("repo");
                  }
                }}
              />
            )}

            {currentStepId === "app-stage" && (
              <AppStageSelector
                selectedStage={formState.appStage}
                onSelect={handleAppStageSelect}
                onNext={() => setCurrentStepId("discovery")}
                onBack={() => setCurrentStepId("tool")}
              />
            )}

            {currentStepId === "discovery" && formState.selectedTool && (
              <DiscoveryPrompt
                selectedTool={formState.selectedTool}
                discoveryResponse={formState.discoveryResponse}
                onResponseChange={(value) =>
                  setFormState((prev) => ({ ...prev, discoveryResponse: value }))
                }
                onSubmit={handleStartScan}
                onBack={() => setCurrentStepId("app-stage")}
                isSubmitting={isSubmitting}
              />
            )}
        </div>
      </div>
    </>
  );
}

export function ScanWizard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading scan wizard...
        </div>
      }
    >
      <ScanWizardContent />
    </Suspense>
  );
}
