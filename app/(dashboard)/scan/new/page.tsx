import { ScanWizard } from "@/components/scan/scan-wizard";

export default function NewScanPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">New Scan</h1>
        <p className="mt-2 text-muted-foreground">
          Connect your repo and we&apos;ll audit your app for security issues.
        </p>
      </div>

      <ScanWizard />
    </main>
  );
}
