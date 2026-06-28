import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome to ShipProof
          </h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8">
        <Link href="/scan/new">
          <Button className="gap-2">
            <ScanSearch className="size-4" />
            Start New Scan
          </Button>
        </Link>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <ScanSearch className="size-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-medium">No scans yet</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Connect a GitHub repository and run your first security scan to see
          results here.
        </p>
      </div>
    </main>
  );
}
