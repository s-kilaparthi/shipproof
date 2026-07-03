import { ScanWizard } from "@/components/scan/scan-wizard";

export default function NewScanPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          New Scan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your repo and we&apos;ll audit your app for security issues.
        </p>
      </div>

      <ScanWizard />
    </main>
  );
}
