import { ScanWizard } from "@/components/scan/scan-wizard";

export default function NewScanPage() {
  return (
    <main className="mx-auto flex h-[calc(100dvh-2rem)] max-w-3xl flex-col overflow-hidden px-4 py-4 sm:px-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          New Scan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your repo and we&apos;ll audit your app for security issues.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <ScanWizard />
      </div>
    </main>
  );
}
