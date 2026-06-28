import { RepoSelector } from "@/components/scan/repo-selector";
import { ToolSelector } from "@/components/scan/tool-selector";
import { DiscoveryPrompt } from "@/components/scan/discovery-prompt";

export default function NewScanPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">New Scan</h1>
      <p className="mt-2 text-muted-foreground">
        Connect your repo and we&apos;ll audit your app for security issues.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <RepoSelector />
        <ToolSelector />
        <div className="md:col-span-2">
          <DiscoveryPrompt />
        </div>
      </div>
    </main>
  );
}
