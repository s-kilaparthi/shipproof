"use client";

export function RepoSelector() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Select Repository</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a GitHub repository to scan.
      </p>
    </div>
  );
}
