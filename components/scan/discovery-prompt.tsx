"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DISCOVERY_PROMPT, type Tool } from "@/types";

interface DiscoveryPromptProps {
  selectedTool: Tool;
  discoveryResponse: string;
  onResponseChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function DiscoveryPrompt({
  selectedTool,
  discoveryResponse,
  onResponseChange,
  onSubmit,
  onBack,
  isSubmitting,
}: DiscoveryPromptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DISCOVERY_PROMPT);
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleSubmit = async () => {
    if (!discoveryResponse.trim()) {
      toast.error("Please paste the discovery response before starting the scan");
      return;
    }

    await onSubmit();
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg">Discovery prompt</CardTitle>
        <p className="text-sm text-muted-foreground">
          Run this prompt in {selectedTool} and paste the response below.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Copy this prompt</p>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy prompt
                </>
              )}
            </Button>
          </div>
          <pre className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-900">
            {DISCOVERY_PROMPT}
          </pre>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="discovery-response" className="text-sm font-medium">
            Paste the response from {selectedTool}
          </label>
          <Textarea
            id="discovery-response"
            placeholder={`Paste the response from ${selectedTool} here...`}
            value={discoveryResponse}
            onChange={(e) => onResponseChange(e.target.value)}
            disabled={isSubmitting}
            className="h-32 resize-none"
          />
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-4 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/50">
            <Loader2 className="size-4 animate-spin" />
            Scanning your codebase...
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !discoveryResponse.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Start scan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
