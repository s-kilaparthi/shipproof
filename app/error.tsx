"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <ShieldCheck className="size-8" />
          <span className="text-2xl">ShipProof</span>
        </div>

        <h1 className="mt-10 text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We&apos;ve been notified and are looking into it. You can try again or
          head back to your dashboard.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
