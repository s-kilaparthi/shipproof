import type { DevOpsTools } from "@/types";

export interface ParsedDiscovery {
  raw: string;
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    auth?: string;
    hosting?: string;
    raw?: string;
  };
  apiRoutes: string[];
  databaseTables: string[];
  environmentVariables: string[];
  securityMeasures: string[];
  summary: string;
  devopsTools: DevOpsTools;
}

export const EMPTY_DEVOPS_TOOLS: DevOpsTools = {
  hasTests: false,
  hasLinting: false,
  hasGitHooks: false,
  hasSentry: false,
  hasLogging: false,
  hasCI: false,
  hasDocker: false,
  hasMonitoring: false,
};

function collectDependencyNames(pkg: Record<string, unknown>): string[] {
  const names: string[] = [];
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const deps = pkg[key];
    if (deps && typeof deps === "object") {
      names.push(...Object.keys(deps as Record<string, unknown>));
    }
  }
  return names;
}

export function parseDevOpsToolsFromPackageJson(
  content: string,
  treeFlags?: Partial<DevOpsTools>
): DevOpsTools {
  try {
    const pkg = JSON.parse(content) as Record<string, unknown>;
    const depNames = collectDependencyNames(pkg).map((name) => name.toLowerCase());
    const scripts =
      pkg.scripts && typeof pkg.scripts === "object"
        ? Object.keys(pkg.scripts as Record<string, unknown>).join(" ").toLowerCase()
        : "";

    const hasInDeps = (patterns: RegExp[]) =>
      depNames.some((name) => patterns.some((pattern) => pattern.test(name)));

    return {
      hasTests:
        treeFlags?.hasTests ??
        (hasInDeps([/^jest$/, /^vitest$/, /^mocha$/, /^@playwright/]) ||
          /test|vitest|jest/.test(scripts)),
      hasLinting:
        treeFlags?.hasLinting ??
        hasInDeps([/^eslint$/, /^prettier$/, /^@typescript-eslint/]),
      hasGitHooks:
        treeFlags?.hasGitHooks ?? hasInDeps([/^husky$/, /^lint-staged$/]),
      hasSentry:
        treeFlags?.hasSentry ?? hasInDeps([/^@sentry\//, /^@sentry$/]),
      hasLogging:
        treeFlags?.hasLogging ??
        hasInDeps([/^winston$/, /^pino$/, /^@logtail/, /^logtail$/]),
      hasCI: treeFlags?.hasCI ?? false,
      hasDocker: treeFlags?.hasDocker ?? false,
      hasMonitoring:
        treeFlags?.hasMonitoring ??
        hasInDeps([/^dd-trace$/, /^newrelic$/, /^@datadog/]),
    };
  } catch {
    return { ...EMPTY_DEVOPS_TOOLS, ...treeFlags };
  }
}

function extractSection(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return "";
}

function extractListItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 2);
}

export function parseDiscoveryResponse(discoveryResponse: string): ParsedDiscovery {
  const raw = discoveryResponse.trim();

  const techStackRaw = extractSection(raw, [
    /(?:1\.?\s*)?tech\s*stack[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /frontend[^:]*:[^\n]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const apiRoutesRaw = extractSection(raw, [
    /(?:3\.?\s*)?(?:all\s*)?api\s*routes?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /endpoints?[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const tablesRaw = extractSection(raw, [
    /(?:4\.?\s*)?database\s*tables?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const envRaw = extractSection(raw, [
    /(?:5\.?\s*)?environment\s*variable[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const securityRaw = extractSection(raw, [
    /(?:7\.?\s*)?(?:existing\s*)?security\s*measures?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const summaryRaw = extractSection(raw, [
    /(?:2\.?\s*)?what\s*this\s*app\s*does[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const techStack = {
    raw: techStackRaw || raw.slice(0, 500),
    frontend: techStackRaw.match(/frontend[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    backend: techStackRaw.match(/backend[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    database: techStackRaw.match(/database[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    auth: techStackRaw.match(/auth[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    hosting: techStackRaw.match(/hosting[:\s]*([^\n,]+)/i)?.[1]?.trim(),
  };

  return {
    raw,
    techStack,
    apiRoutes: extractListItems(apiRoutesRaw),
    databaseTables: extractListItems(tablesRaw),
    environmentVariables: extractListItems(envRaw),
    securityMeasures: extractListItems(securityRaw),
    summary: summaryRaw || "No summary provided",
    devopsTools: { ...EMPTY_DEVOPS_TOOLS },
  };
}

export function formatStackSummary(parsed: ParsedDiscovery): string {
  const parts = [
    parsed.techStack.frontend && `framework: ${parsed.techStack.frontend}`,
    parsed.techStack.database && `database: ${parsed.techStack.database}`,
    parsed.techStack.hosting && `hosting: ${parsed.techStack.hosting}`,
    parsed.techStack.backend &&
      !parsed.techStack.frontend &&
      `backend: ${parsed.techStack.backend}`,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(", ");
  if (parsed.summary && parsed.summary !== "No summary provided") {
    return parsed.summary.slice(0, 400);
  }
  return "";
}

function cleanStackText(text: string): string {
  return text
    .replace(/^[\s\-*•]+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stack summary for "Ask your AI tool" prompts — PILLAR 1, first paragraph, or tool fallback. */
export function extractStackSummaryFromDiscovery(
  discoveryResponse: string | null | undefined,
  tool: string
): string {
  const fallback = `Built with ${tool}`;
  const raw = discoveryResponse?.trim();
  if (!raw) return fallback;

  const pillar1Match = raw.match(
    /##\s*PILLAR\s*1\s*[—\-–]\s*IDENTITY\s*([\s\S]*?)(?=##\s*PILLAR|\Z)/i
  );
  if (pillar1Match?.[1]?.trim()) {
    const section = cleanStackText(pillar1Match[1]);
    if (section.length > 20) return section.slice(0, 400);
  }

  const structured = formatStackSummary(parseDiscoveryResponse(raw));
  if (structured.length > 0) return structured;

  const beforeNextPillar = raw.split(/\n##\s*PILLAR/i)[0]?.trim() ?? raw;
  const firstParagraph = beforeNextPillar
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find(
      (paragraph) =>
        paragraph.length > 30 &&
        !paragraph.startsWith("You are a code") &&
        !paragraph.startsWith("Just answer")
    );
  if (firstParagraph) {
    return cleanStackText(firstParagraph).slice(0, 400);
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("#") &&
        !line.startsWith("You are") &&
        !line.startsWith("Just answer")
    );
  if (lines.length > 0) {
    return cleanStackText(lines.slice(0, 8).join(" ")).slice(0, 400);
  }

  return fallback;
}

export function discoveryToMarkdown(parsed: ParsedDiscovery): string {
  return `### Tech Stack
- Frontend: ${parsed.techStack.frontend ?? "Unknown"}
- Backend: ${parsed.techStack.backend ?? "Unknown"}
- Database: ${parsed.techStack.database ?? "Unknown"}
- Auth: ${parsed.techStack.auth ?? "Unknown"}
- Hosting: ${parsed.techStack.hosting ?? "Unknown"}

### API Routes
${parsed.apiRoutes.length > 0 ? parsed.apiRoutes.map((r) => `- ${r}`).join("\n") : "- None identified"}

### Database Tables
${parsed.databaseTables.length > 0 ? parsed.databaseTables.map((t) => `- ${t}`).join("\n") : "- None identified"}

### Environment Variables
${parsed.environmentVariables.length > 0 ? parsed.environmentVariables.map((e) => `- ${e}`).join("\n") : "- None identified"}

### Security Measures
${parsed.securityMeasures.length > 0 ? parsed.securityMeasures.map((s) => `- ${s}`).join("\n") : "- None identified"}

### App Summary
${parsed.summary}`;
}
