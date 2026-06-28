import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Wrench } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />

          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                <Sparkles className="size-4" />
                Built for AI-native founders
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                You build it.{" "}
                <span className="text-muted-foreground">We make sure it runs.</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Security audits, fix prompts and DevOps guidance for non-technical
                founders.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Scan Your App
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-24 grid max-w-4xl gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Shield className="mx-auto size-8 text-primary" />
                <h3 className="mt-4 font-semibold">Security Audits</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Catch vulnerabilities before your users do.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Sparkles className="mx-auto size-8 text-primary" />
                <h3 className="mt-4 font-semibold">Fix Prompts</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Copy-paste prompts to fix issues in your AI builder.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Wrench className="mx-auto size-8 text-primary" />
                <h3 className="mt-4 font-semibold">DevOps Guidance</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deploy with confidence, even without a technical co-founder.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
