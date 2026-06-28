import type { ScanIssue } from "../types";
import type { Tool } from "@/types";

const SECURITY_HEADERS: {
  header: string;
  severity: ScanIssue["severity"];
  issueName: string;
  description: string;
}[] = [
  {
    header: "x-frame-options",
    severity: "warning",
    issueName: "Missing X-Frame-Options Header",
    description:
      "X-Frame-Options header is not set. Your app may be vulnerable to clickjacking attacks.",
  },
  {
    header: "x-content-type-options",
    severity: "warning",
    issueName: "Missing X-Content-Type-Options Header",
    description:
      "X-Content-Type-Options header is not set. Browsers may MIME-sniff responses incorrectly.",
  },
  {
    header: "strict-transport-security",
    severity: "warning",
    issueName: "Missing Strict-Transport-Security Header",
    description:
      "HSTS header is not configured. Users may be vulnerable to SSL stripping attacks.",
  },
  {
    header: "content-security-policy",
    severity: "warning",
    issueName: "Missing Content-Security-Policy Header",
    description:
      "CSP header is not set. Your app lacks protection against XSS and data injection attacks.",
  },
  {
    header: "x-xss-protection",
    severity: "info",
    issueName: "Missing X-XSS-Protection Header",
    description:
      "X-XSS-Protection header is not set. Legacy browsers may lack XSS filtering.",
  },
];

export interface InfrastructureCheckResult {
  issues: ScanIssue[];
  skipped: boolean;
  url?: string;
  sslPassed?: boolean;
  missingHeaders: string[];
}

function normalizeDomain(domain: string): string {
  let url = domain.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  return url.replace(/\/$/, "");
}

function buildHeaderFixPrompt(tool: Tool, header: string): string {
  return `Add the ${header} security header to all HTTP responses in my app. Configure it in my server/middleware (Next.js middleware.ts, Express app.use, or hosting platform config). Use secure, production-ready values for ${header}.`;
}

export async function checkInfrastructure(
  domain: string | null | undefined,
  tool: Tool
): Promise<InfrastructureCheckResult> {
  if (!domain?.trim()) {
    return { issues: [], skipped: true, missingHeaders: [] };
  }

  const issues: ScanIssue[] = [];
  const url = normalizeDomain(domain);
  const missingHeaders: string[] = [];

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    for (const { header, severity, issueName, description } of SECURITY_HEADERS) {
      if (!response.headers.get(header)) {
        missingHeaders.push(header);
        issues.push({
          pillar: "infrastructure",
          severity,
          issue_name: issueName,
          file_path: null,
          line_number: null,
          description,
          fix_prompt: buildHeaderFixPrompt(tool, header),
          fix_type: "cursor",
        });
      }
    }

    return {
      issues,
      skipped: false,
      url,
      sslPassed: true,
      missingHeaders,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isSslError =
      message.toLowerCase().includes("ssl") ||
      message.toLowerCase().includes("certificate") ||
      message.toLowerCase().includes("cert");

    if (isSslError || message.includes("fetch failed")) {
      issues.push({
        pillar: "infrastructure",
        severity: "critical",
        issue_name: "SSL Certificate Error",
        file_path: null,
        line_number: null,
        description: `Could not establish a secure connection to ${url}. SSL certificate may be invalid or expired.`,
        fix_prompt: `Fix the SSL certificate for ${domain}. Ensure a valid TLS certificate is installed on your hosting provider and HTTPS is properly configured.`,
        fix_type: "manual",
      });
    }

    return {
      issues,
      skipped: false,
      url,
      sslPassed: false,
      missingHeaders,
    };
  }
}
