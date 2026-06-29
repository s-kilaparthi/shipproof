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
import { normalizeFixType } from "./fix-type-utils";
import {
  calculateHealthScoreBreakdown,
  calculateHealthScores,
} from "./health-score";
import { applySeverityRules } from "./severity-rules";
import type { ScanEngineInput, ScanEngineResult, ScanIssue } from "./types";

export type { ScanIssue, ScanEngineInput, ScanEngineResult };

const COMBINED_SYSTEM_PROMPT = `You are a senior security engineer and DevOps architect auditing a vibe-coded application built by a non-technical founder.

RULES:
- Only report issues you can see EVIDENCE of in the actual code
- Never invent issues
- Reference exact file names and function names from the code
- Be concise: description max 2 sentences
- Maximum 12 audit issues + exactly 3 threat scenarios = 15 total
- Respond ONLY with a raw JSON array. No markdown, no explanation, no code fences. Just [ ... ]

CRITICAL RULE FOR fix_prompt:
Every fix_prompt must be COMPLETE — it must fix the issue entirely with no hanging follow-up tasks left for the user.

If fixing an issue requires changes in multiple places (example: adding auth to backend AND updating frontend to send auth headers), include ALL steps in one fix_prompt.

Format multi-step fixes like this:
'STEP 1 — backend/main.py: [exact instruction for Cursor]

STEP 2 — frontend/src/Students.jsx: [exact instruction for Cursor after Step 1 is done]'

Rules for fix_prompt:
- If the fix only touches one file: write normally, no steps
- If the fix touches 2+ files: use STEP 1, STEP 2 format
- Never write a fix that breaks something else
- Always include the frontend fix if backend auth changes
- Always include environment variable updates if adding secrets
- Maximum 4 steps per fix
- Each step must name the exact file
- For mixed fix types use typed step headers, e.g. STEP 1 — SQL (Supabase): ... and STEP 2 — cursor (backend/main.py): ...
- fix_prompt must name the exact file, exact library, exact method

Example of a correct multi-step fix_prompt:
'STEP 1 — backend/main.py: Add verify_institute_admin_or_teacher middleware to /create-student, /create-teacher, and /delete-user endpoints requiring Authorization: Bearer header.

STEP 2 — frontend/src/Students.jsx and frontend/src/Teachers.jsx: Update all API calls to these endpoints to include Authorization: Bearer \${session.access_token} header from the Supabase session object.'`;

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

Also add a fix_type field to each issue:
- 'cursor' if the fix requires editing code files in Cursor/Lovable/Bolt/v0
- 'sql' if the fix requires running SQL in Supabase dashboard or database
- 'terminal' if the fix requires running a command in terminal (npm install, etc)
- 'manual' if the fix requires manual action in a dashboard or settings page

Examples:
- Adding auth middleware → 'cursor'
- Enabling RLS policies → 'sql'
- Updating a package → 'terminal'
- Enabling GitHub 2FA → 'manual'

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
    "fix_type": "cursor|sql|terminal|manual",
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
    fix_type: normalizeFixType(issue.fix_type),
    confidence: normalizeConfidence(issue.confidence),
    evidence: issue.evidence ? String(issue.evidence) : null,
  }));
}

function applySeverityRulesToIssues(issues: ScanIssue[]): {
  issues: ScanIssue[];
  overrideCount: number;
} {
  let overrideCount = 0;

  const updated = issues.map((issue) => {
    const original = issue.severity;
    const severity = applySeverityRules(
      issue.issue_name,
      issue.description,
      issue.severity
    );

    if (severity !== original) {
      overrideCount++;
    }

    return { ...issue, severity };
  });

  return { issues: updated, overrideCount };
}

export async function runCombinedAnalysis(
  discoveryResponse: string,
  codeMarkdown: string,
  tool: Tool,
  fileCount: number
): Promise<ScanIssue[]> {
  console.log(
    `[scan/analyzer] Layer 4: Sending ${fileCount} files, ${codeMarkdown.length} chars to Claude`
  );

  const userPrompt = buildCombinedUserPrompt(
    discoveryResponse,
    codeMarkdown,
    tool
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0,
      system: COMBINED_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("[scan/analyzer] Layer 4: No text response from Claude");
      console.log("[scan/analyzer] Layer 4: Claude returned 0 raw issues");
      console.log("[scan/analyzer] Layer 4: 0 issues passed confidence filter");
      return [];
    }

    const raw = extractJsonArray(textBlock.text);
    const mapped = mapRawIssues(raw);

    console.log(
      `[scan/analyzer] Layer 4: Claude returned ${mapped.length} raw issues`
    );

    if (mapped.length === 0) {
      console.warn("[scan/analyzer] Layer 4: Claude returned empty or unparseable JSON");
    }

    const { issues: severityAdjusted, overrideCount } =
      applySeverityRulesToIssues(mapped);
    console.log(
      `[scan/analyzer] Severity rules applied: ${overrideCount} overrides`
    );

    const { issues: confidenceFiltered } = filterByConfidence(severityAdjusted);
    console.log(
      `[scan/analyzer] Layer 4: ${confidenceFiltered.length} issues passed confidence filter`
    );

    return confidenceFiltered;
  } catch (error) {
    console.error("[scan/analyzer] Layer 4: Combined Claude analysis failed:", error);
    console.log("[scan/analyzer] Layer 4: Claude returned 0 raw issues");
    console.log("[scan/analyzer] Layer 4: 0 issues passed confidence filter");
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

  const { issues: secretIssues, scannedFileCount } = scanSecrets(files, tool);
  console.log(
    `[scan/analyzer] Layer 1: Scanning ${scannedFileCount} files for secrets`
  );
  if (secretIssues.length > 0) {
    console.log(`[scan/analyzer] Layer 1: Found ${secretIssues.length} secrets`);
  } else {
    console.log("[scan/analyzer] Layer 1: No secrets found");
  }

  const dependencyResult = await auditDependencies(files);
  if (dependencyResult.skipped) {
    console.log("[scan/analyzer] Layer 2: No dependency file found - skipping");
  } else {
    const depFileNames = dependencyResult.dependencyFiles.map((filePath) =>
      filePath.endsWith("requirements.txt") ? "requirements.txt" : "package.json"
    );
    const uniqueDepFiles = Array.from(new Set(depFileNames)).join("/");
    console.log(`[scan/analyzer] Layer 2: Found ${uniqueDepFiles}`);
    console.log(
      `[scan/analyzer] Layer 2: Checking ${dependencyResult.packageCount} packages against OSV.dev`
    );

    if (dependencyResult.osvFailed) {
      console.log("[scan/analyzer] Layer 2: OSV.dev API failed - skipping");
    } else if (dependencyResult.issues.length > 0) {
      console.log(
        `[scan/analyzer] Layer 2: Found ${dependencyResult.issues.length} vulnerabilities`
      );
    } else {
      console.log("[scan/analyzer] Layer 2: No vulnerabilities found");
    }
  }

  const infraResult = await checkInfrastructure(domain, tool);
  if (infraResult.skipped) {
    console.log("[scan/analyzer] Layer 3: No domain provided - skipping");
  } else {
    console.log(`[scan/analyzer] Layer 3: Checking ${infraResult.url}`);
    if (infraResult.sslPassed) {
      console.log("[scan/analyzer] Layer 3: SSL check passed");
    } else {
      console.log("[scan/analyzer] Layer 3: SSL check failed");
    }

    if (infraResult.sslPassed) {
      if (infraResult.missingHeaders.length > 0) {
        console.log(
          `[scan/analyzer] Layer 3: Missing headers: ${infraResult.missingHeaders.join(", ")}`
        );
      } else {
        console.log("[scan/analyzer] Layer 3: All security headers present");
      }
    }
  }

  const aiIssues = await runCombinedAnalysis(
    discoveryResponse,
    codeMarkdown,
    tool,
    files.length
  );

  const normalized = normalizeIssues(
    [
      ...secretIssues,
      ...dependencyResult.issues,
      ...infraResult.issues,
      ...aiIssues,
    ],
    tool
  );

  console.log(
    `[scan/analyzer] Before dedup: ${normalized.length} total issues from all layers`
  );

  const { issues: deduped, removed: dedupRemoved } = deduplicateIssues(normalized);
  console.log(`[scan/analyzer] After dedup: ${deduped.length} issues remaining`);

  if (dedupRemoved > 0) {
    console.log(`[scan/analyzer] Deduplicated ${dedupRemoved} issues`);
  }

  const { issues: filtered, filteredLow } = filterByConfidence(deduped);
  if (filteredLow > 0) {
    console.log(
      `[scan/analyzer] Filtered ${filteredLow} low-confidence issues from non-AI layers`
    );
  }

  const scoreBreakdown = calculateHealthScoreBreakdown(filtered);
  const pillarScores = calculateHealthScores(filtered);

  const capMessage =
    scoreBreakdown.pillarCap != null
      ? `${scoreBreakdown.pillarCap} → final score: ${scoreBreakdown.finalScore}`
      : `none → final score: ${scoreBreakdown.finalScore}`;

  console.log(
    `[scan/analyzer] Score formula: started 100, -${scoreBreakdown.criticalCount} critical, -${scoreBreakdown.warningCount} warning, -${scoreBreakdown.infoCount} info = ${scoreBreakdown.rawScore}, pillar cap applied: ${capMessage}`
  );
  console.log(`[scan/analyzer] Total issues saved: ${filtered.length}`);
  console.log(`[scan/analyzer] Overall score: ${pillarScores.overall}`);

  return { issues: filtered };
}
