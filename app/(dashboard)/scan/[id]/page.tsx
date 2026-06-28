import { ScanReport } from "@/components/scan/scan-report";

interface ScanDetailPageProps {
  params: { id: string };
}

export default function ScanDetailPage({ params }: ScanDetailPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Scan Results</h1>
      <p className="mt-2 text-muted-foreground">Scan ID: {params.id}</p>
      <div className="mt-8">
        <ScanReport />
      </div>
    </main>
  );
}
