"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "Scanning for exposed secrets...",
  "Checking dependencies for vulnerabilities...",
  "Checking infrastructure...",
  "Running AI security analysis...",
];

interface ScanLoadingProps {
  isActive: boolean;
  serviceUnavailable?: boolean;
  onTryAgain?: () => void;
}

export function ScanLoading({
  isActive,
  serviceUnavailable = false,
  onTryAgain,
}: ScanLoadingProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isActive || serviceUnavailable) {
      setActiveStep(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, serviceUnavailable]);

  if (!isActive && !serviceUnavailable) return null;

  if (serviceUnavailable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-xl border-2 border-gray-900 bg-card p-8 text-center shadow-lg dark:border-white">
          <h2 className="text-xl font-semibold text-foreground">
            Scan temporarily unavailable
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Our scanning service is experiencing high demand. Please try again
            in a few minutes.
          </p>
          {onTryAgain ? (
            <Button
              type="button"
              className="mt-6 h-11 w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 sm:w-auto sm:px-8"
              onClick={onTryAgain}
            >
              Try Again
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-card-border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="size-10 animate-spin text-foreground" />
          <h2 className="mt-6 text-xl font-semibold text-foreground">
            Analyzing your app
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Optimized 4-layer scan in progress. This may take a minute.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {LOADING_STEPS.map((step, index) => {
            const isComplete = index < activeStep;
            const isCurrent = index === activeStep;

            return (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                  isCurrent && "border-black bg-muted/50 dark:border-white",
                  isComplete && "border-border bg-muted/30",
                  !isCurrent && !isComplete && "border-transparent opacity-50"
                )}
              >
                {isComplete ? (
                  <Check className="size-4 shrink-0 text-green-600" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-foreground" />
                ) : (
                  <div className="size-4 shrink-0 rounded-full border border-muted-foreground/30" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isCurrent && "font-medium text-foreground",
                    isComplete && "text-muted-foreground",
                    !isCurrent && !isComplete && "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
