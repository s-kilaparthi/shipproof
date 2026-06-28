import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your security scans.
          </p>
        </div>
        <Link href="/scan/new">
          <Button>New Scan</Button>
        </Link>
      </div>
    </main>
  );
}
