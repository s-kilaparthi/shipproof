import type { ScanIssue } from "../types";
import type { FetchedFile } from "../github-files";
import {
  getFilePriorityRank,
  isPrioritySecretScanFile,
} from "../file-targeting";
import type { Tool } from "@/types";

const SECRET_PATTERNS: {
  name: string;
  regex: RegExp;
  skipEnvFiles?: boolean;
}[] = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Private Key", regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  {
    name: "API Key",
    regex: /api[_-]?key['":\s=]+['"][a-zA-Z0-9]{20,}['"]/i,
  },
  {
    name: "MongoDB Connection String",
    regex: /mongodb(\+srv)?:\/\/.+:.+@/i,
  },
  {
    name: "Hardcoded Password",
    regex: /password['":\s=]+['"][^'"]{8,}['"]/i,
  },
  { name: "Stripe Live Key", regex: /sk_live_[a-zA-Z0-9]{24,}/ },
  { name: "OpenAI Key", regex: /sk-[a-zA-Z0-9]{48}/ },
  { name: "GitHub Token", regex: /ghp_[a-zA-Z0-9]{36}/ },
  {
    name: "Supabase Service Key",
    regex: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
    skipEnvFiles: true,
  },
];

function isEnvFile(path: string): boolean {
  return (
    path.endsWith(".env") ||
    path.includes(".env.") ||
    path.endsWith(".env.local")
  );
}

function buildSecretFixPrompt(tool: Tool, filePath: string): string {
  return `In ${filePath}, remove the hardcoded secret and move it to an environment variable. Update .env.example with the variable name only. In ${tool}, load it via process.env at runtime. Never commit real secrets.`;
}

export function scanSecrets(files: FetchedFile[], tool: Tool): ScanIssue[] {
  const priorityFiles = files.filter((f) => isPrioritySecretScanFile(f.path));
  const patternMatches = new Map<
    string,
    { issue: ScanIssue; rank: number }
  >();

  for (const file of priorityFiles) {
    const lines = file.content.split("\n");
    const rank = getFilePriorityRank(file.path);

    for (const { name, regex, skipEnvFiles } of SECRET_PATTERNS) {
      if (skipEnvFiles && isEnvFile(file.path)) continue;

      regex.lastIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (!regex.test(lines[i])) continue;

        const patternKey = name;
        const candidate: ScanIssue = {
          pillar: "security",
          severity: "critical",
          issue_name: "Exposed Secret in Code",
          file_path: file.path,
          line_number: i + 1,
          description: `A potential ${name} was found hardcoded in ${file.path}:${i + 1}. This is a critical security risk.`,
          fix_prompt: buildSecretFixPrompt(tool, file.path),
          confidence: "high",
          evidence: lines[i].trim().slice(0, 120),
        };

        const existing = patternMatches.get(patternKey);
        if (!existing || rank > existing.rank) {
          patternMatches.set(patternKey, { issue: candidate, rank });
        }
      }
    }
  }

  return Array.from(patternMatches.values()).map((m) => m.issue);
}
