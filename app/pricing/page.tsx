import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { FaqSection } from "@/components/landing/faq-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { FadeIn } from "@/components/landing/motion";
import { PricingSection } from "@/components/landing/pricing-section";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      <section className="border-b border-card-border bg-muted-background px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with a free scan. Upgrade when you&apos;re ready to launch.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl px-0 sm:px-2">
          <PricingSection showHeading={false} authAware />
        </div>
      </section>

      <section className="border-t border-card-border bg-background px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Common questions
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-12">
              <FaqSection />
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-card-border bg-background px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-foreground">
                <ShieldCheck className="size-6" />
                ShipProof
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You build it. We make sure it runs.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="text-foreground hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="text-foreground hover:underline">
                Terms
              </Link>
              <a
                href="mailto:privacy@shipproof.app"
                className="text-foreground hover:underline"
              >
                Contact
              </a>
            </div>
          </div>
          <p className="mt-8 border-t border-card-border pt-8 text-center text-xs text-muted-foreground">
            © 2026 ShipProof · shipproof.app
          </p>
        </div>
      </footer>
    </div>
  );
}
