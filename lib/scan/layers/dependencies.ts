import type { FetchedFile } from "../github-files";
import { buildDependencyVulnerabilityFixPrompt } from "../dependency-fix-utils";
import type { ScanIssue } from "../types";

interface PackageEntry {
  name: string;
  version: string;
  ecosystem: "npm" | "PyPI";
}

interface OsvVuln {
  id?: string;
  summary?: string;
  database_specific?: { severity?: string };
}

interface OsvQueryResult {
  vulns?: OsvVuln[];
}

export interface DependencyAuditResult {
  issues: ScanIssue[];
  dependencyFiles: string[];
  packageCount: number;
  osvFailed: boolean;
  skipped: boolean;
}

function parsePackageJson(content: string): PackageEntry[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const entries: PackageEntry[] = [];
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const [name, version] of Object.entries(allDeps ?? {})) {
      const clean = version.replace(/^[\^~>=<]/, "").split(" ")[0];
      if (clean) entries.push({ name, version: clean, ecosystem: "npm" });
    }

    return entries;
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string): PackageEntry[] {
  const entries: PackageEntry[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:[=<>!~]+(.+))?/);
    if (!match) continue;

    entries.push({
      name: match[1],
      version: match[2]?.trim() || "0",
      ecosystem: "PyPI",
    });
  }

  return entries;
}

function mapOsvSeverity(severity?: string): ScanIssue["severity"] {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "critical";
  if (s === "MEDIUM") return "warning";
  return "info";
}

export async function auditDependencies(
  files: FetchedFile[]
): Promise<DependencyAuditResult> {
  const dependencyFiles: string[] = [];
  let packages: PackageEntry[] = [];

  for (const file of files) {
    if (file.path.endsWith("package.json")) {
      dependencyFiles.push(file.path);
      packages = packages.concat(parsePackageJson(file.content));
    }
    if (file.path.endsWith("requirements.txt")) {
      dependencyFiles.push(file.path);
      packages = packages.concat(parseRequirementsTxt(file.content));
    }
  }

  if (packages.length === 0) {
    return {
      issues: [],
      dependencyFiles,
      packageCount: 0,
      osvFailed: false,
      skipped: true,
    };
  }

  try {
    const response = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: packages.map((pkg) => ({
          package: { name: pkg.name, ecosystem: pkg.ecosystem },
          version: pkg.version,
        })),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        issues: [],
        dependencyFiles,
        packageCount: packages.length,
        osvFailed: true,
        skipped: false,
      };
    }

    const data = (await response.json()) as { results?: OsvQueryResult[] };
    const issues: ScanIssue[] = [];

    (data.results ?? []).forEach((result, index) => {
      const pkg = packages[index];
      if (!pkg) return;

      if (!result.vulns?.length) {
        console.log(
          `[scan/analyzer] Layer 2: Package ${pkg.name}@${pkg.version} - clean`
        );
        return;
      }

      for (const vuln of result.vulns) {
        const severity = mapOsvSeverity(vuln.database_specific?.severity);
        console.log(
          `[scan/analyzer] Layer 2: Vulnerability found - package: ${pkg.name}, version: ${pkg.version}, vuln_id: ${vuln.id ?? "unknown"}, severity: ${severity}`
        );
        issues.push({
          pillar: "dependencies",
          severity,
          issue_name: `Vulnerable Dependency: ${pkg.name}`,
          file_path: pkg.ecosystem === "npm" ? "package.json" : "requirements.txt",
          line_number: null,
          description: `${vuln.id ?? "CVE"}: ${vuln.summary ?? "Known vulnerability in this package version."}`,
          fix_prompt: buildDependencyVulnerabilityFixPrompt({
            packageName: pkg.name,
            version: pkg.version,
            vulnId: vuln.id ?? "CVE",
            description:
              vuln.summary ?? "Known vulnerability in this package version.",
          }),
          fix_type: "cursor",
          fix_confidence: "uncertain",
          confidence: "high",
          evidence: null,
        });
      }
    });

    return {
      issues,
      dependencyFiles,
      packageCount: packages.length,
      osvFailed: false,
      skipped: false,
    };
  } catch {
    return {
      issues: [],
      dependencyFiles,
      packageCount: packages.length,
      osvFailed: true,
      skipped: false,
    };
  }
}
