"use client";

import type { Tool } from "@/types";

const tools: Tool[] = ["Cursor", "Lovable", "Bolt", "V0"];

export function ToolSelector() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Select Tool</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Which AI builder did you use to create your app?
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <span
            key={tool}
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
