"use client";

import Link from "next/link";
import { ArrowRight, GitBranch, MessageSquare, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingWelcomeProps {
  firstName: string;
}

const STEPS = [
  {
    number: "01",
    title: "Connect your repo",
    description: "GitHub",
    icon: GitBranch,
  },
  {
    number: "02",
    title: "Run the discovery prompt",
    description: "in your AI tool",
    icon: MessageSquare,
  },
  {
    number: "03",
    title: "Get your security report",
    description: "+ fix prompts",
    icon: ShieldCheck,
  },
];

export function OnboardingWelcome({ firstName }: OnboardingWelcomeProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
          <ShieldCheck className="size-7" />
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to ShipProof, {firstName}!
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Let&apos;s find the security issues in your app.
          <br />
          Here&apos;s how it works:
        </p>
      </div>

      <ol className="mt-12 space-y-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.number}
              className="flex items-start gap-4 rounded-xl border border-border bg-muted/20 p-5"
            >
              <span className="font-mono text-2xl font-bold text-muted-foreground">
                {step.number}
              </span>
              <div className="flex flex-1 items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    {step.title}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({step.description})
                    </span>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Most apps have 5–10 security issues they don&apos;t know about.
        <br />
        Let&apos;s find yours.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/scan/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full max-w-sm gap-2 text-base"
          )}
        >
          Start Your Free Scan
          <ArrowRight className="size-4" />
        </Link>
        <p className="text-xs text-muted-foreground">Takes about 2 minutes</p>
      </div>
    </main>
  );
}
