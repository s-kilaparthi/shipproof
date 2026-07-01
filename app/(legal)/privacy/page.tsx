import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ShipProof",
  description: "How ShipProof handles your data.",
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

export default function PrivacyPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        ShipProof helps you scan your apps for security and DevOps issues. This
        page explains what we collect, what we don&apos;t, and how you stay in
        control of your data.
      </p>

      <Section title="What we collect">
        <p>When you use ShipProof, we store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your email address (from GitHub sign-in)</li>
          <li>Your GitHub username</li>
          <li>Scan results — issue names, severity, fix prompts, and scores</li>
          <li>Which repo you scanned and when</li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <p>
          We do <strong className="font-medium text-foreground">not</strong> store
          your source code. Files are fetched from GitHub only during a scan,
          analyzed in memory, and discarded. We never save a copy of your codebase.
        </p>
      </Section>

      <Section title="How we use your data">
        <p>
          We use your information only to run ShipProof — sign you in, run scans,
          show your reports, and save your scan history. We don&apos;t sell your
          data or use it for advertising.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>ShipProof relies on these providers to operate:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium text-foreground">Supabase</strong> —
            authentication and database
          </li>
          <li>
            <strong className="font-medium text-foreground">Vercel</strong> —
            hosting
          </li>
          <li>
            <strong className="font-medium text-foreground">Anthropic</strong> —
            AI-powered code analysis during scans
          </li>
          <li>
            <strong className="font-medium text-foreground">GitHub</strong> —
            sign-in and read-only repo access for scanning
          </li>
        </ul>
        <p>
          Each provider has its own privacy policy. We only share the minimum
          data needed for the service to work.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          We keep your account and scan history until you delete them. If you
          delete your account, your data is removed from our systems.
        </p>
      </Section>

      <Section title="Delete your data">
        <p>
          You can delete individual scans from your dashboard at any time. To
          remove your entire account and all associated data, use the delete
          option in settings (one click).
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy? Email us at{" "}
          <a
            href="mailto:privacy@shipproof.app"
            className="text-foreground underline underline-offset-2"
          >
            privacy@shipproof.app
          </a>
          .
        </p>
      </Section>

      <p className="text-sm text-muted-foreground">
        See also our{" "}
        <Link href="/terms" className="text-foreground underline underline-offset-2">
          Terms of Service
        </Link>
        .
      </p>
    </article>
  );
}
