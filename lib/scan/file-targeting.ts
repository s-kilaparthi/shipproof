import type { ParsedDiscovery } from "./discovery-parser";

export interface FilePattern {
  pattern: string;
  priority: number;
}

const EXCLUDED_PATH_PATTERNS = [
  /node_modules\//,
  /\/dist\//,
  /^dist\//,
  /\/build\//,
  /^build\//,
  /\/\.next\//,
  /^\.next\//,
  /\/public\//,
  /^public\//,
  /components\/ui\//,
];

const EXCLUDED_EXTENSIONS =
  /\.(test|spec)\.(ts|js|tsx|jsx)$|\.(md|mdx|txt|d\.ts|css|scss|svg|png|jpg|ico)$|^(package-lock\.json|yarn\.lock)$/;

const DEVOPS_PRIORITY_PATTERNS: RegExp[] = [
  /(^|\/)\\.github\/workflows\/[^/]+\.ya?ml$/i,
  /(^|\/)vercel\.json$/,
  /(^|\/)railway\.toml$/,
  /(^|\/)fly\.toml$/,
  /(^|\/)docker-compose\.ya?ml$/,
  /(^|\/)Dockerfile$/,
  /(^|\/)\\.dockerignore$/,
  /(^|\/)netlify\.toml$/,
  /(^|\/)render\.ya?ml$/,
  /(^|\/)\\.circleci\/config\.ya?ml$/,
];

const OBSERVABILITY_PRIORITY_PATTERNS: RegExp[] = [
  /(^|\/)sentry\.config\.js$/,
  /(^|\/)sentry\.client\.config\.js$/,
  /(^|\/)sentry\.server\.config\.js$/,
  /(^|\/)datadog\.config\.js$/,
  /(^|\/)pino\.config\.js$/,
  /(^|\/)winston\.config\.js$/,
  /(^|\/)logtail\.config\.js$/,
  /monitor/i,
  /logger/i,
];

const CONFIG_PRIORITY_PATTERNS: RegExp[] = [
  /(^|\/)\\.env\.example$/,
  /(^|\/)jest\.config\.(js|ts|mjs|cjs)$/,
  /(^|\/)vitest\.config\.(ts|js|mjs)$/,
  /(^|\/)\\.eslintrc(\.(js|json|yaml|yml))?$/,
  /(^|\/)eslint\.config\.(js|ts|mjs|cjs)$/,
  /(^|\/)\\.husky\//,
];

const MIGRATION_PRIORITY_PATTERNS: RegExp[] = [
  /(^|\/)supabase\/migrations\/[^/]+\.sql$/,
  /(^|\/)supabase\/seed\.sql$/,
  /(^|\/)database\/migrations\/[^/]+\.sql$/,
  /(^|\/)prisma\/migrations\/.+\.sql$/,
  /_rls\.sql$/,
  /_policies\.sql$/,
];

const MANDATORY_PATTERNS: RegExp[] = [
  ...MIGRATION_PRIORITY_PATTERNS,
  ...DEVOPS_PRIORITY_PATTERNS,
  ...OBSERVABILITY_PRIORITY_PATTERNS,
  ...CONFIG_PRIORITY_PATTERNS,
  /middleware\.(ts|js)$/,
  /auth/i,
  /app\/api\//,
  /pages\/api\//,
  /(^|\/)routes\//,
  /(^|\/)main\.py$/,
  /(^|\/)app\.py$/,
  /next\.config\.(js|ts|mjs)$/,
  /config/i,
  /(^|\/)supabase\.ts$/,
  /(^|\/)database\.ts$/,
  /(^|\/)db\.ts$/,
  /\.env\.example$/,
  /schema/i,
  /(^|\/)package\.json$/,
  /(^|\/)requirements\.txt$/,
];

const STACK_PATTERNS: Record<string, FilePattern[]> = {
  nextjs: [
    { pattern: "middleware.ts", priority: 100 },
    { pattern: "middleware.js", priority: 100 },
    { pattern: "app/api/**", priority: 95 },
    { pattern: "pages/api/**", priority: 95 },
    { pattern: "next.config.js", priority: 90 },
    { pattern: "next.config.ts", priority: 90 },
  ],
  fastapi: [
    { pattern: "main.py", priority: 100 },
    { pattern: "app.py", priority: 100 },
    { pattern: "routers/**", priority: 95 },
    { pattern: "dependencies.py", priority: 90 },
    { pattern: "routes/**", priority: 90 },
  ],
  supabase: [
    { pattern: "supabase/migrations/**", priority: 100 },
    { pattern: "supabase/seed.sql", priority: 100 },
    { pattern: "database/migrations/**", priority: 100 },
    { pattern: "prisma/migrations/**", priority: 100 },
    { pattern: "**/*_rls.sql", priority: 100 },
    { pattern: "**/*_policies.sql", priority: 100 },
    { pattern: "**/supabase/**", priority: 95 },
    { pattern: "**/*rls*", priority: 90 },
    { pattern: "**/*policy*", priority: 90 },
    { pattern: "**/*schema*", priority: 90 },
  ],
  express: [
    { pattern: "server.js", priority: 100 },
    { pattern: "server.ts", priority: 100 },
    { pattern: "routes/**", priority: 95 },
    { pattern: "middleware/**", priority: 95 },
  ],
  firebase: [
    { pattern: "firestore.rules", priority: 100 },
    { pattern: "functions/**", priority: 95 },
  ],
  devops: [
    { pattern: ".github/workflows/**", priority: 100 },
    { pattern: "vercel.json", priority: 100 },
    { pattern: "railway.toml", priority: 95 },
    { pattern: "fly.toml", priority: 95 },
    { pattern: "docker-compose.yml", priority: 95 },
    { pattern: "Dockerfile", priority: 95 },
    { pattern: ".dockerignore", priority: 90 },
    { pattern: "netlify.toml", priority: 90 },
    { pattern: "render.yaml", priority: 90 },
    { pattern: ".circleci/config.yml", priority: 95 },
  ],
  observability: [
    { pattern: "sentry.config.js", priority: 100 },
    { pattern: "sentry.client.config.js", priority: 100 },
    { pattern: "sentry.server.config.js", priority: 100 },
    { pattern: "datadog.config.js", priority: 100 },
    { pattern: "pino.config.js", priority: 95 },
    { pattern: "winston.config.js", priority: 95 },
    { pattern: "logtail.config.js", priority: 95 },
    { pattern: "**/*monitor*", priority: 90 },
    { pattern: "**/*logger*", priority: 90 },
  ],
};

const FILE_PATH_REGEX =
  /[`'"]?([a-zA-Z0-9_./-]+\.(?:ts|tsx|js|jsx|py|sql|toml|json))[`'"]?/g;

export function isExcludedFile(filePath: string): boolean {
  if (filePath === ".env" || filePath.endsWith("/.env")) return true;
  if (EXCLUDED_EXTENSIONS.test(filePath)) return true;
  return EXCLUDED_PATH_PATTERNS.some((p) => p.test(filePath));
}

export function isMandatoryPriorityFile(filePath: string): boolean {
  return MANDATORY_PATTERNS.some((p) => p.test(filePath));
}

export function isMigrationPriorityFile(filePath: string): boolean {
  return MIGRATION_PRIORITY_PATTERNS.some((p) => p.test(filePath));
}

export function isCriticalFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  if (isMandatoryPriorityFile(filePath)) return true;
  if (lower.includes("middleware")) return true;
  if (lower.includes("/api/") || lower.includes("routes/")) return true;
  if (lower.includes("auth")) return true;
  return false;
}

export function isPrioritySecretScanFile(filePath: string): boolean {
  if (filePath.includes("components/ui/")) return false;
  return isCriticalFile(filePath) || isMandatoryPriorityFile(filePath);
}

export function extractFilePathsFromDiscovery(
  discoveryResponse: string,
  allFiles: string[]
): string[] {
  const mentioned = new Set<string>();
  const fileSet = new Set(allFiles);

  const sections = [
    discoveryResponse.match(/PILLAR 2[\s\S]*?(?=PILLAR 3|$)/i)?.[0] ?? "",
    discoveryResponse.match(/PILLAR 3[\s\S]*?(?=PILLAR 4|$)/i)?.[0] ?? "",
    discoveryResponse,
  ];

  for (const section of sections) {
    let match: RegExpExecArray | null;
    FILE_PATH_REGEX.lastIndex = 0;
    while ((match = FILE_PATH_REGEX.exec(section)) !== null) {
      const candidate = match[1].replace(/^\.\//, "");
      if (fileSet.has(candidate)) {
        mentioned.add(candidate);
        continue;
      }
      const fuzzy = allFiles.find(
        (f) => f.endsWith(`/${candidate}`) || f === candidate
      );
      if (fuzzy) mentioned.add(fuzzy);
    }
  }

  return Array.from(mentioned);
}

function detectStacks(parsed: ParsedDiscovery): string[] {
  const text = [
    parsed.techStack.raw,
    parsed.techStack.frontend,
    parsed.techStack.backend,
    parsed.techStack.database,
    parsed.techStack.auth,
    parsed.raw,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const stacks: string[] = [];

  if (text.includes("next") || text.includes("nextjs")) stacks.push("nextjs");
  if (text.includes("fastapi") || text.includes("python")) stacks.push("fastapi");
  if (text.includes("supabase")) stacks.push("supabase");
  if (text.includes("express") || text.includes("node")) stacks.push("express");
  if (text.includes("firebase")) stacks.push("firebase");
  stacks.push("devops", "observability");
  if (stacks.length === 0) stacks.push("nextjs");

  return stacks;
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___GLOBSTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___GLOBSTAR___/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function matchesPattern(filePath: string, pattern: string): boolean {
  if (pattern.includes("**") || pattern.includes("*")) {
    return globToRegex(pattern).test(filePath);
  }
  return filePath === pattern || filePath.endsWith(`/${pattern}`);
}

function scoreFile(filePath: string, parsed: ParsedDiscovery, stacks: string[]): number {
  let score = 0;

  if (isMandatoryPriorityFile(filePath)) score += 200;

  for (const stack of stacks) {
    for (const { pattern, priority } of STACK_PATTERNS[stack] ?? []) {
      if (matchesPattern(filePath, pattern)) {
        score = Math.max(score, priority);
      }
    }
  }

  const lower = filePath.toLowerCase();
  if (
    ["supabase", "rls", "policy", "schema", "migrations"].some((k) =>
      lower.includes(k)
    )
  ) {
    score += 20;
  }

  if (isMigrationPriorityFile(filePath)) score += 50;

  return score;
}

export function selectTargetFiles(
  allFiles: string[],
  parsed: ParsedDiscovery,
  maxFiles = 15
): string[] {
  const eligible = allFiles.filter((f) => !isExcludedFile(f));
  const stacks = detectStacks(parsed);
  const fromDiscovery = extractFilePathsFromDiscovery(parsed.raw, eligible);
  const mandatory = eligible.filter(isMandatoryPriorityFile);

  const selected = new Set<string>();

  for (const path of [...mandatory, ...fromDiscovery]) {
    if (eligible.includes(path)) selected.add(path);
  }

  const scored = eligible
    .filter((f) => !selected.has(f))
    .map((path) => ({ path, score: scoreFile(path, parsed, stacks) }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { path } of scored) {
    if (selected.size >= maxFiles) break;
    selected.add(path);
  }

  if (selected.size === 0) {
    return eligible
      .filter((f) => /\.(ts|tsx|js|jsx|py|sql|json)$/.test(f))
      .slice(0, maxFiles);
  }

  const mandatoryList = Array.from(selected).filter(isMandatoryPriorityFile);
  const rest = Array.from(selected).filter((p) => !isMandatoryPriorityFile(p));

  if (mandatoryList.length >= maxFiles) {
    return mandatoryList;
  }

  return [...mandatoryList, ...rest].slice(0, maxFiles);
}

export function parseRepoFullName(repoName: string): { owner: string; repo: string } {
  const [owner, repo] = repoName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo name: ${repoName}`);
  return { owner, repo };
}

export function getFilePriorityRank(filePath: string): number {
  if (filePath.includes("middleware")) return 100;
  if (filePath.includes("auth")) return 90;
  if (filePath.includes("/api/")) return 85;
  if (filePath.includes("config")) return 80;
  return 10;
}
