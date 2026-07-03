"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { FadeIn } from "@/components/landing/motion";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "1 free scan",
  "See all issues found",
  "1 fix prompt included",
  "Basic report",
];

const LAUNCH_FEATURES = [
  "3 full scans",
  "All 5 analysis layers",
  "Complete report with all issues",
  "All fix prompts included",
  '"Ask AI tool" prompts for complex fixes',
  "90 days scan history",
];

interface PricingSectionProps {
  showHeading?: boolean;
  className?: string;
}

export function PricingSection({
  showHeading = true,
  className,
}: PricingSectionProps) {
  const waitlistRef = useRef<HTMLDivElement>(null);
  const [waitlistPlan, setWaitlistPlan] = useState<"launch" | null>(null);

  const scrollToWaitlist = (plan: "launch" | null) => {
    setWaitlistPlan(plan);
    waitlistRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={cn("mx-auto max-w-6xl", className)}>
      {showHeading ? (
        <FadeIn>
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start free. Scale when you&apos;re ready.
          </h2>
        </FadeIn>
      ) : null}

      <div
        className={cn(
          "mx-auto grid max-w-4xl gap-6 lg:grid-cols-2 lg:gap-8",
          showHeading ? "mt-12" : "mt-0"
        )}
      >
        <FadeIn delay={0}>
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="flex h-full flex-col rounded-xl border border-card-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-muted-foreground">Free</h3>
            <p className="mt-2 text-3xl font-bold text-foreground">$0</p>
            <p className="text-sm text-muted-foreground">Try ShipProof</p>
            <ul className="mt-6 flex-1 space-y-2">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="size-4 shrink-0 text-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/login" className="mt-6 block">
              <Button
                variant="outline"
                className="h-11 w-full border-gray-900 text-foreground hover:bg-muted dark:border-gray-100"
              >
                Start Free Scan
              </Button>
            </Link>
          </motion.div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative flex h-full flex-col rounded-xl border-2 border-gray-900 bg-card p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-100"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-card-border bg-background px-3 py-0.5 text-xs font-medium text-foreground">
              Most Popular
            </span>
            <h3 className="text-lg font-semibold text-muted-foreground">Launch</h3>
            <p className="mt-2 text-3xl font-bold text-foreground">$9</p>
            <p className="text-sm text-muted-foreground">one-time payment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Perfect for your next launch
            </p>
            <ul className="mt-6 flex-1 space-y-2">
              {LAUNCH_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="size-4 shrink-0 text-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              onClick={() => scrollToWaitlist("launch")}
              className="mt-6 h-11 w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Join Waitlist
            </Button>
          </motion.div>
        </FadeIn>
      </div>

      <FadeIn delay={0.2}>
        <div
          ref={waitlistRef}
          id="waitlist"
          className="mt-16 scroll-mt-28 text-center"
        >
          <p className="text-lg font-semibold text-foreground">
            More plans coming soon
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Need unlimited scans or team access? Join our waitlist and get 50%
            off at launch.
          </p>
          <div className="mx-auto mt-6 max-w-lg">
            <WaitlistForm
              plan={waitlistPlan}
              planLabel={
                waitlistPlan === "launch"
                  ? "Joining waitlist for Launch ($9 one-time)"
                  : undefined
              }
            />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
