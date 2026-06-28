import { anthropic } from "@/lib/claude";
import type { Tool } from "@/types";

import { auditDependencies } from "./layers/dependencies";
import { checkInfrastructure } from "./layers/infrastructure";
import { scanSecrets } from "./layers/secrets";
import {
  deduplicateIssues,
  filterByConfidence,
  normalizeConfidence,
} from "./issue-utils";
import type { ScanEngineInput, ScanEngineResult, ScanIssue } from "./types";

export type { ScanIssue, ScanEngineInput, ScanEngineResult };

const COMBINED_SYSTEM_PROMPT = `You are a senior security engineer and DevOps architect auditing a vibe-coded application built by a non-technical founder.

RULES:
- Only report issues you can see EVIDENCE of in the actual code
- Never invent issues
- Reference exact file names and function names from the code
- Be concise: description max 2 sentences, fix_prompt max 3 sentences
- Maximum 12 audit issues + exactly 3 threat scenarios = 15 total
- fix_prompt must name the exact file, exact library, exact method
- Respond ONLY with a raw JSON array. No markdown, no explanation, no code fences. Just [ ... ]`;

function buildCombinedUserPrompt(
  discoveryResponse: string,
  codeMarkdown: string,
  tool: Tool
): string {
  return `## App Discovery (6 Pillars)
${discoveryResponse}

## Codebase Files
${codeMarkdown}

## Tool Selected
The user built this with ${tool}. All fix_prompts must be written as prompts to paste into ${tool} specifically.

## Task 1 — Security Audit (max 12 issues)
Check ONLY if you see evidence in the code above.
Skip any check where the code looks fine.

SECURITY PILLAR:
- API endpoints with no auth check → critical
- CORS set to wildcard * → critical
- No input validation on user inputs → critical
- Supabase RLS disabled or missing → critical
- Hardcoded secrets or API keys → critical
- No rate limiting on public endpoints → critical

DATABASE PILLAR:
- No pagination on list queries → warning
- N+1 query patterns in loops → warning
- SELECT * fetching all columns → warning
- Missing indexes on foreign keys → info
- No connection pooling config → info

PERFORMANCE PILLAR:
- No caching on repeated expensive queries → warning
- No CDN for static assets → info

RELIABILITY PILLAR:
- No error handling on async operations → warning
- No health check endpoint → warning
- No retry logic on external API calls → info
- No timeout configuration → info

OBSERVABILITY PILLAR:
- No logging setup → warning
- No error monitoring like Sentry → warning

DEVOPS PILLAR:
- No environment separation dev/prod → warning
- No CI/CD pipeline → info
- No rate limiting middleware → warning

## Task 2 — Threat Modeling (exactly 3)
Based on what this app does and its stack, add exactly 3 realistic attack scenarios a malicious actor would attempt.
Be specific to THIS app — not generic web app threats.
Use pillar: 'security', severity: 'critical'
issue_name must start with 'Threat: '

## Confidence Field
For each issue add:
'confidence': 'high' if you can quote exact code evidence,
'confidence': 'medium' if you can reference the file/function,
'confidence': 'low' if it is inferred

## Return Format
[
  {
    "pillar": "security|database|performance|reliability|observability|devops",
    "severity": "critical|warning|info",
    "issue_name": "Short specific name",
    "file_path": "exact/file/path.ts or null",
    "line_number": 42 or null,
    "description": "Max 2 sentences with specific code reference",
    "fix_prompt": "Paste into ${tool}: specific fix naming exact file and library",
    "confidence": "high|medium|low",
    "evidence": "exact quote from code or null"
  }
]`;
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  if (start === -1) return [];

  try {
    const slice = cleaned.slice(start);
    const end = slice.lastIndexOf("]");
    if (end !== -1) {
      return JSON.parse(slice.slice(0, end + 1)) as Record<string, unknown>[];
    }
  } catch {
    // fall through to object extraction
  }

  const results: Record<string, unknown>[] = [];
  let depth = 0;
  let currentStart = -1;

  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (depth === 0) currentStart = i;
      depth++;
    } else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0 && currentStart !== -1) {
        try {
          const obj = JSON.parse(
            cleaned.slice(currentStart, i + 1)
          ) as Record<string, unknown>;
          results.push(obj);
        } catch {
          // skip malformed object
        }
        currentStart = -1;
      }
    }
  }

  return results;
}

function mapRawIssues(raw: Record<string, unknown>[]): ScanIssue[] {
  return raw.map((issue, index) => ({
    pillar: String(issue.pillar ?? "security").toLowerCase() as ScanIssue["pillar"],
    severity: String(issue.severity ?? "info").toLowerCase() as ScanIssue["severity"],
    issue_name: String(issue.issue_name ?? `Issue ${index + 1}`),
    file_path: issue.file_path ? String(issue.file_path) : null,
    line_number: typeof issue.line_number === "number" ? issue.line_number : null,
    description: String(issue.description ?? ""),
    fix_prompt: String(issue.fix_prompt ?? ""),
    confidence: normalizeConfidence(issue.confidence),
    evidence: issue.evidence ? String(issue.evidence) : null,
  }));
}

export async function runCombinedAnalysis(
  discoveryResponse: string,
  codeMarkdown: string,
  tool: Tool
): Promise<ScanIssue[]> {
  const userPrompt = buildCombinedUserPrompt(
    discoveryResponse,
    codeMarkdown,
    tool
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: COMBINED_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("[scan/analyzer] No text response from Claude");
      return [];
    }

    const raw = extractJsonArray(textBlock.text);
    if (raw.length === 0) {
      console.warn("[scan/analyzer] Claude returned empty or unparseable JSON");
    }

    return mapRawIssues(raw);
  } catch (error) {
    console.error("[scan/analyzer] Combined Claude analysis failed:", error);
    return [];
  }
}

export function normalizeIssues(issues: ScanIssue[], tool: Tool): ScanIssue[] {
  return issues.map((issue) => ({
    ...issue,
    severity: issue.severity.toLowerCase() as ScanIssue["severity"],
    confidence: issue.confidence ?? "medium",
    fix_prompt: issue.fix_prompt
      .replace(/\[TOOL_NAME\]/g, tool)
      .replace(/\[TOOL\]/g, tool),
  }));
}

export async function runFullScan(input: ScanEngineInput): Promise<ScanEngineResult> {
  const { files, tool, domain, discoveryResponse, codeMarkdown } = input;

  console.log("[scan/analyzer] Layer 1: Secret scanning (priority files only)");
  const secretIssues = scanSecrets(files, tool);

  console.log("[scan/analyzer] Layer 2: Dependency audit");
  const dependencyIssues = await auditDependencies(files);

  console.log("[scan/analyzer] Layer 3: Infrastructure check");
  const infraIssues = await checkInfrastructure(domain, tool);

  console.log("[scan/analyzer] Layer 4: Combined AI analysis (single call)");
  const aiIssues = await runCombinedAnalysis(
    discoveryResponse,
    codeMarkdown,
    tool
  );

  const normalized = normalizeIssues(
    [...secretIssues, ...dependencyIssues, ...infraIssues, ...aiIssues],
    tool
  );

  const { issues: deduped, removed: dedupRemoved } = deduplicateIssues(normalized);
  if (dedupRemoved > 0) {
    console.log(`[scan/analyzer] Deduplicated ${dedupRemoved} issues`);
  }

  const { issues: filtered, filteredLow } = filterByConfidence(deduped);
  if (filteredLow > 0) {
    console.log(`[scan/analyzer] Filtered ${filteredLow} low-confidence issues`);
  }

  return { issues: filtered };
}
