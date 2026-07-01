import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ShipProof",
  description: "Terms for using ShipProof.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        By using ShipProof, you agree to these terms. We&apos;ve kept them short
        and in plain English.
      </p>

      <Section title="What ShipProof is">
        <p>
          ShipProof is a security and DevOps scanning tool for apps built with
          AI coding tools. It reads your repository, finds issues, and gives you
          copy-paste fix prompts. It is not a substitute for a full security
          audit or legal compliance review.
        </p>
      </Section>

      <Section title="What you can use it for">
        <p>
          You may use ShipProof to scan repositories you own or have explicit
          permission to test. Use it to improve the security and reliability of
          your own applications.
        </p>
      </Section>

      <Section title="What you can't do">
        <p>You may not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Scan repositories you don&apos;t own or lack permission to access</li>
          <li>Use ShipProof to attack, disrupt, or probe systems without authorization</li>
          <li>Abuse the service (spam scans, attempt to break rate limits, etc.)</li>
          <li>Resell or repackage ShipProof without our permission</li>
        </ul>
      </Section>

      <Section title="Our limitations">
        <p>
          ShipProof uses automated and AI-powered analysis. It may miss issues or
          occasionally flag false positives. Results are guidance, not guarantees.
          You are responsible for reviewing and applying fixes before shipping to
          production.
        </p>
      </Section>

      <Section title="Payment terms">
        <p>
          ShipProof is free to start. When we add paid plans, we&apos;ll update
          these terms with pricing, billing cycles, and refund policies before
          charging you. We won&apos;t charge without clear notice.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using ShipProof anytime by deleting your account. We may
          suspend or terminate accounts that violate these terms or abuse the
          service. We&apos;ll try to give notice when possible, except in cases of
          serious abuse.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a
            href="mailto:legal@shipproof.app"
            className="text-foreground underline underline-offset-2"
          >
            legal@shipproof.app
          </a>
          .
        </p>
      </Section>

      <p className="text-sm text-muted-foreground">
        See also our{" "}
        <Link href="/privacy" className="text-foreground underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </article>
  );
}
