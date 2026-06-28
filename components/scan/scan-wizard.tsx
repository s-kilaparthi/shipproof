"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DiscoveryPrompt } from "@/components/scan/discovery-prompt";
import { RepoSelector } from "@/components/scan/repo-selector";
import { ScanReport } from "@/components/scan/scan-report";
import { ToolSelector } from "@/components/scan/tool-selector";
import { cn } from "@/lib/utils";
import {
  SCAN_STEPS,
  type CreateScanResponse,
  type GitHubRepo,
  type ScanFormState,
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

export function ScanWizard() {
  const [currentStep, setCurrentStep] = useState<ScanStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<ScanFormState>({
    selectedRepo: null,
    selectedTool: null,
    discoveryResponse: "",
    scanId: null,
  });

  const handleRepoSelect = (repo: GitHubRepo) => {
    setFormState((prev) => ({ ...prev, selectedRepo: repo }));
  };

  const handleToolSelect = (tool: Tool) => {
    setFormState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleStartScan = async () => {
    if (!formState.selectedRepo || !formState.selectedTool) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: formState.selectedRepo.full_name,
          repo_url: formState.selectedRepo.html_url,
          tool_selected: formState.selectedTool,
          discovery_response: formState.discoveryResponse,
        }),
      });

      const data = (await response.json()) as CreateScanResponse & {
        error?: string;
        details?: string;
        code?: string;
      };

      if (!response.ok) {
        const message = [data.error, data.details, data.code]
          .filter(Boolean)
          .join(" — ");
        throw new Error(message || "Failed to start scan");
      }

      setFormState((prev) => ({ ...prev, scanId: data.id }));
      setCurrentStep(4);
      toast.success("Scan started successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start scan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <StepIndicator currentStep={currentStep} />

      <div className="relative overflow-hidden">
        <div
          key={currentStep}
          className="transition-all duration-300 ease-out"
        >
          {currentStep === 1 && (
            <RepoSelector
              selectedRepo={formState.selectedRepo}
              onSelect={handleRepoSelect}
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

          {currentStep === 4 &&
            formState.scanId &&
            formState.selectedRepo &&
            formState.selectedTool && (
              <ScanReport
                scanId={formState.scanId}
                repo={formState.selectedRepo}
                tool={formState.selectedTool}
                status="scanning"
              />
            )}
        </div>
      </div>
    </div>
  );
}
