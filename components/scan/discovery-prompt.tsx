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
    <Card>
      <CardHeader>
        <CardTitle>Discovery prompt</CardTitle>
        <p className="text-sm text-muted-foreground">
          Run this prompt in {selectedTool} and paste the response below.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
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
                  Copy Prompt
                </>
              )}
            </Button>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
            {DISCOVERY_PROMPT}
          </pre>
        </div>

        <div className="space-y-2">
          <label htmlFor="discovery-response" className="text-sm font-medium">
            Paste the response from {selectedTool} here
          </label>
          <Textarea
            id="discovery-response"
            placeholder={`Paste the response from ${selectedTool} here...`}
            value={discoveryResponse}
            onChange={(e) => onResponseChange(e.target.value)}
            rows={10}
            disabled={isSubmitting}
            className="min-h-[200px] resize-y"
          />
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Scanning your codebase...</span>
          </div>
        )}

        <div className="flex justify-between pt-2">
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
              "Start Scan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
