"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Eye,
  GitBranch,
  Lock,
  Search,
  Server,
  Shield,
  ShieldX,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { FaqSection } from "@/components/landing/faq-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { FadeIn, HeroFadeIn } from "@/components/landing/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  "🔒 We never store your code",
  "⚡ Scan in under 2 minutes",
  "🎯 Copy-paste fix prompts",
  "✅ Free to start",
];

const PROBLEM_CARDS = [
  {
    icon: ShieldX,
    iconClass: "text-red-400",
    title: "Your app has no rate limiting",
    body: "Any attacker can spam your API, drain your budget, and bring down your server. AI never told you to add it.",
    label: "Security",
  },
  {
    icon: Zap,
    iconClass: "text-amber-400",
    title: "Loading 50,000 rows with no pagination",
    body: "Works fine with 10 users. Crashes at 1,000. You'll find out at the worst possible time.",
    label: "Performance",
  },
  {
    icon: Server,
    iconClass: "text-purple-400",
    title: "No error monitoring",
    body: "Your app goes down at 2am. You find out from an angry user on Twitter. Not from your own system.",
    label: "Infrastructure",
  },
];

const STEPS: Array<{
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    num: "01",
    icon: GitBranch,
    title: "Connect your repo",
    desc: "Sign in with GitHub and select the repo you want to scan. Read-only access — we never modify your code.",
  },
  {
    num: "02",
    icon: Search,
    title: "We scan everything",
    desc: "ShipProof runs 5 analysis layers: secret scanning, dependency vulnerabilities, infrastructure checks, AI security analysis, and threat modeling.",
  },
  {
    num: "03",
    icon: Copy,
    title: "Copy. Paste. Fixed.",
    desc: "Get a prioritized report with copy-paste fix prompts for your exact tool. Paste into Cursor, Lovable, or Bolt — done.",
  },
];

const CHECKS_LEFT = [
  "Unauthenticated API endpoints",
  "Missing rate limiting",
  "CORS misconfiguration",
  "Exposed API keys and secrets",
  "Missing Supabase RLS policies",
  "SQL injection vulnerabilities",
];

const CHECKS_RIGHT = [
  "Vulnerable dependencies (CVE database)",
  "Missing database indexes",
  "No pagination on list queries",
  "SSL and security headers",
  "No error monitoring setup",
  "No CI/CD pipeline",
];

const MOCK_ISSUES = [
  {
    severity: "Critical",
    pillar: "Security",
    color: "text-red-400",
    dot: "bg-red-500",
    title: "Unauthenticated API endpoints",
    desc: "3 endpoints have no auth check — anyone on the internet can call them",
  },
  {
    severity: "Critical",
    pillar: "Security",
    color: "text-red-400",
    dot: "bg-red-500",
    title: "No rate limiting",
    desc: "Your API can be spammed with unlimited requests",
  },
  {
    severity: "Warning",
    pillar: "Database",
    color: "text-amber-400",
    dot: "bg-amber-500",
    title: "No pagination on list queries",
    desc: "Loading all rows at once will crash under real traffic",
  },
];

const TOOLS = [
  { name: "Cursor", desc: "AI code editor" },
  { name: "Lovable", desc: "AI web app builder" },
  { name: "Bolt", desc: "AI full stack builder" },
  { name: "v0", desc: "AI UI builder by Vercel" },
];

const PRICING: Array<{
  name: string;
  price: string;
  subtitle: string;
  tagline?: string;
  features: string[];
  cta: string;
  popular: boolean;
  filled: boolean;
}> = [
  {
    name: "Free",
    price: "Free",
    subtitle: "Perfect for trying ShipProof",
    features: ["1 free scan", "Top 3 issues only", "Basic report"],
    cta: "Start Free",
    popular: false,
    filled: false,
  },
  {
    name: "One-Time",
    price: "$49",
    subtitle: "one-time payment",
    tagline: "For your next launch",
    features: [
      "1 full scan",
      "All 5 analysis layers",
      "Complete report",
      "All fix prompts",
      "30 day scan history",
    ],
    cta: "Get Full Scan",
    popular: true,
    filled: true,
  },
  {
    name: "Pro",
    price: "$29/month",
    subtitle: "For active builders",
    features: [
      "Unlimited scans",
      "All 5 analysis layers",
      "Full reports",
      "Priority support",
      "Scan history forever",
    ],
    cta: "Start Pro",
    popular: false,
    filled: false,
  },
];

const TRUST_CARDS: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    icon: Lock,
    title: "We never store your code",
    desc: "We fetch only the files needed for analysis, scan them in memory, and discard them immediately.",
  },
  {
    icon: Eye,
    title: "Read-only GitHub access",
    desc: "We request read-only repository access. We can never modify, delete, or push to your repo.",
  },
  {
    icon: Shield,
    title: "Enterprise-grade infrastructure",
    desc: "Built on Vercel and Supabase — SOC 2 compliant infrastructure used by millions of developers.",
  },
  {
    icon: Trash2,
    title: "Delete anytime",
    desc: "Delete your account and all scan history with one click. No questions asked.",
  },
];

function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-center text-3xl font-bold tracking-tight text-white sm:text-4xl",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pb-32 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#3b82f6]/10 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-[#8b5cf6]/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <HeroFadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
              🚀 Built for the vibe coding generation
            </span>
          </HeroFadeIn>

          <HeroFadeIn delay={0.1}>
            <h1 className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              You build it.
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                We make sure it runs.
              </span>
            </h1>
          </HeroFadeIn>

          <HeroFadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              ShipProof scans your vibe-coded app for security vulnerabilities,
              performance issues, and DevOps gaps — then gives you copy-paste fix
              prompts for Cursor, Lovable, Bolt, and v0.
            </p>
          </HeroFadeIn>

          <HeroFadeIn delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-12 w-full min-w-[200px] bg-[#3b82f6] px-8 text-base text-white hover:bg-[#2563eb] sm:w-auto"
                >
                  Scan Your App Free
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full min-w-[200px] border-white/20 bg-transparent px-8 text-base text-white hover:bg-white/10 sm:w-auto"
                >
                  See a Sample Report
                </Button>
              </Link>
            </div>
          </HeroFadeIn>

          <HeroFadeIn delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-400">
              {TRUST_ITEMS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </HeroFadeIn>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-white/5 bg-[#0a0a0f] px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading>
              Your app works perfectly.
              <br />
              <span className="text-gray-500">Until it doesn&apos;t.</span>
            </SectionHeading>
          </FadeIn>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PROBLEM_CARDS.map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-white/10 bg-[#12121a] p-6">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {card.label}
                  </span>
                  <card.icon className={cn("mt-4 size-8", card.iconClass)} />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {card.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <blockquote className="mx-auto mt-16 max-w-xl border-l-2 border-[#3b82f6] pl-6">
              <p className="text-lg italic text-gray-300">
                &ldquo;your app works at 10 users.
                <br />
                here&apos;s why it breaks at 1,000&rdquo;
              </p>
              <footer className="mt-3 text-sm text-gray-500">
                — viral tweet that started the conversation
              </footer>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading>Three steps to production-ready</SectionHeading>
          </FadeIn>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div className="relative">
                  <span className="text-5xl font-bold text-white/10">
                    {step.num}
                  </span>
                  <div className="mt-4 flex size-12 items-center justify-center rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10">
                    <step.icon className="size-6 text-[#3b82f6]" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What we check */}
      <section className="border-t border-white/5 bg-[#12121a]/30 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <SectionHeading>We check what AI forgot to build</SectionHeading>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-3">
                {CHECKS_LEFT.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {CHECKS_RIGHT.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-center text-sm text-[#8b5cf6]">
              + threat modeling specific to your app type
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Report preview */}
      <section className="border-t border-white/5 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <SectionHeading>A report your whole team can understand</SectionHeading>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-8 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sample scan · anonymized</p>
                  <p className="mt-1 font-mono text-sm text-gray-400">
                    my-saas-app
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex size-24 items-center justify-center rounded-full border-4 border-red-500/30 bg-red-500/10">
                    <span className="text-3xl font-bold text-red-400">23</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-red-400">
                    Not Ready to Ship
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {MOCK_ISSUES.map((issue, i) => (
                  <motion.div
                    key={issue.title}
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("size-2 rounded-full", issue.dot)} />
                      <span className={cn("text-xs font-medium", issue.color)}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-400">{issue.pillar}</span>
                    </div>
                    <h4 className="mt-2 font-medium text-white">{issue.title}</h4>
                    <p className="mt-1 text-sm text-gray-400">{issue.desc}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-white/10 text-gray-300 hover:bg-white/5"
                    >
                      Fix Prompt
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
              Every issue includes a copy-paste fix prompt tailored to your tool
              — Cursor, Lovable, Bolt, or v0
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Tools */}
      <section className="border-t border-white/5 bg-[#12121a]/30 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading>Works with every vibe coding tool</SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool, i) => (
              <FadeIn key={tool.name} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#12121a] p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{tool.name}</h3>
                    <Check className="size-5 text-[#3b82f6]" />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{tool.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/5 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading>Start free. Scale when you&apos;re ready.</SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PRICING.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-[#12121a] p-6",
                    plan.popular
                      ? "border-[#3b82f6] shadow-lg shadow-[#3b82f6]/10"
                      : "border-white/10"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3b82f6] px-3 py-0.5 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-300">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {plan.price}
                  </p>
                  <p className="text-sm text-gray-500">{plan.subtitle}</p>
                  {plan.tagline && (
                    <p className="mt-1 text-sm text-gray-400">{plan.tagline}</p>
                  )}
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <Check className="size-4 text-[#3b82f6]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="mt-6 block">
                    <Button
                      className={cn(
                        "w-full",
                        plan.filled
                          ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                          : "border-white/20 bg-transparent text-white hover:bg-white/10"
                      )}
                      variant={plan.filled ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-white/5 bg-[#12121a]/30 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionHeading>Your code stays yours</SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {TRUST_CARDS.map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <card.icon className="size-5 text-[#3b82f6]" />
                  </div>
                  <h3 className="mt-3 font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {card.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <SectionHeading>Common questions</SectionHeading>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-12">
              <FaqSection />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5 px-4 py-24 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ship with confidence.
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Join founders who caught their security issues before their users
              did.
            </p>
            <Link href="/login" className="mt-8 inline-block">
              <Button
                size="lg"
                className="h-14 bg-[#3b82f6] px-10 text-lg text-white hover:bg-[#2563eb]"
              >
                Scan Your App Free
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Free scan · No credit card required
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-bold">⚡ ShipProof</p>
              <p className="mt-1 text-sm text-gray-500">
                You build it. We make sure it runs.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/login" className="hover:text-white">
                Privacy
              </Link>
              <Link href="/login" className="hover:text-white">
                Terms
              </Link>
              <Link href="/login" className="hover:text-white">
                Contact
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Built with ❤️ for the vibe coding generation
            </p>
          </div>
          <p className="mt-8 border-t border-white/5 pt-8 text-center text-xs text-gray-600">
            © 2026 ShipProof · shipproof.app
          </p>
        </div>
      </footer>
    </div>
  );
}
