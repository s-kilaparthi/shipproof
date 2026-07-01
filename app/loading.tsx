import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Loader2 className="size-8 animate-spin text-foreground" aria-hidden />
      <p className="mt-4 text-sm text-muted-foreground">Loading ShipProof...</p>
    </main>
  );
}
