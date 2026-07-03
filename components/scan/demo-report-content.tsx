"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LandingNav } from "@/components/landing/landing-nav";
import { ReportView } from "@/components/scan/report-view";
import { Button } from "@/components/ui/button";
import {
  DEMO_FIXED_ISSUE_IDS,
  DEMO_ISSUE_NOTES,
  DEMO_ISSUES,
  DEMO_PILLAR_SCORES,
  DEMO_SCAN_ID_EXPORT,
} from "@/lib/demo/shipproof-scan-data";

export function DemoReportContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingNav />

      {/* Hero banner */}
      <section className="bg-gray-900 px-4 pb-12 pt-28 text-white sm:px-6 sm:pb-16 sm:pt-32">
        <div className="relative mx-auto max-w-4xl">
          <span className="absolute right-0 top-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            This is a real scan of shipproof.app
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs text-gray-300">
            <ShieldCheck className="size-3.5" />
            Real scan · Not a demo
          </span>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            We scanned ShipProof with ShipProof
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
            Before launch, we ran ShipProof on our own codebase. Here&apos;s exactly
            what we found — and how we fixed it using our own tool.
          </p>

          <p className="mt-6 text-sm text-gray-400 sm:text-base">
            9 critical issues found · Fixed in one session · Score improved from 0
            → 67
          </p>

          <Link href="/login" className="mt-8 inline-block">
            <Button
              size="lg"
              className="h-12 bg-white px-8 text-base font-semibold text-gray-900 hover:bg-gray-100"
            >
              Scan Your App Free →
            </Button>
          </Link>
        </div>
      </section>

      {/* Report */}
      <section className="px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <ReportView
            scanId={DEMO_SCAN_ID_EXPORT}
            repoName="shipproof"
            tool="Cursor"
            scanDate="March 1, 2026"
            status="completed"
            pillarScores={DEMO_PILLAR_SCORES}
            issues={DEMO_ISSUES}
            scoreImprovement={{
              previousScore: 0,
              fixedCount: DEMO_FIXED_ISSUE_IDS.length,
            }}
            initialFixedIssueIds={DEMO_FIXED_ISSUE_IDS}
            readOnly
            scoreSubtitle="Improved from 0 after fixing 7 issues"
            fixedBadgeLabel="Fixed using ShipProof"
            issueNotes={DEMO_ISSUE_NOTES}
            hideReportFooter
            showScoreCelebration={false}
            expandAllIssuePillars
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 text-center dark:border-gray-800 dark:bg-gray-900/40 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Ready to find issues in your app?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            ShipProof found 9 critical issues in our own codebase before launch. We
            fixed 7 of them using our own fix prompts in one session.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Scan Your App Free →
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Free scan · No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
