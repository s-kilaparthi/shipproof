import type { DevOpsTools, RepoScanMetadata } from "@/types";

const CI_PATH_PATTERNS = [
  /^\.github\/workflows\/.+\.ya?ml$/i,
  /^\.gitlab-ci\.ya?ml$/i,
  /^\.circleci\/config\.ya?ml$/i,
  /^Jenkinsfile$/i,
  /^render\.ya?ml$/i,
];

const CI_CONFIG_FILES = [
  "vercel.json",
  ".github",
  ".gitlab-ci.yml",
  "circle.yml",
  "Jenkinsfile",
];

const DOCKER_FILES = [
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".dockerignore",
];

const SENTRY_FILES = [
  "sentry.config.js",
  "sentry.client.config.js",
  "sentry.server.config.js",
];

function pathMatches(allPaths: string[], pattern: RegExp): boolean {
  return allPaths.some((path) => pattern.test(path));
}

export function detectRepoMetadataFromTree(allPaths: string[]): RepoScanMetadata {
  const hasCI =
    pathMatches(allPaths, /^\.github\/workflows\/.+\.ya?ml$/i) ||
    CI_PATH_PATTERNS.some((pattern) => pathMatches(allPaths, pattern)) ||
    allPaths.some((path) =>
      CI_CONFIG_FILES.some(
        (file) => path === file || path.startsWith(`${file}/`) || path.endsWith(`/${file}`)
      )
    );

  const hasDocker = allPaths.some((path) =>
    DOCKER_FILES.some(
      (file) => path === file || path.endsWith(`/${file}`)
    )
  );

  const hasSentry = allPaths.some((path) =>
    SENTRY_FILES.some(
      (file) => path === file || path.endsWith(`/${file}`)
    ) || /sentry/i.test(path)
  );

  const hasTests =
    pathMatches(allPaths, /jest\.config\.(js|ts|mjs|cjs)$/i) ||
    pathMatches(allPaths, /vitest\.config\.(ts|js|mjs)$/i) ||
    pathMatches(allPaths, /mocha/i);

  return { hasCI, hasDocker, hasSentry, hasTests };
}

export function mergeDevOpsTools(
  fromTree: RepoScanMetadata,
  fromPackage: Partial<DevOpsTools>
): DevOpsTools {
  return {
    hasTests: fromPackage.hasTests ?? fromTree.hasTests,
    hasLinting: fromPackage.hasLinting ?? false,
    hasGitHooks: fromPackage.hasGitHooks ?? false,
    hasSentry: fromPackage.hasSentry ?? fromTree.hasSentry,
    hasLogging: fromPackage.hasLogging ?? false,
    hasCI: fromPackage.hasCI ?? fromTree.hasCI,
    hasDocker: fromPackage.hasDocker ?? fromTree.hasDocker,
    hasMonitoring: fromPackage.hasMonitoring ?? false,
  };
}

export async function verifyPathExists(
  checkPath: (path: string) => Promise<boolean>,
  path: string
): Promise<boolean> {
  try {
    return await checkPath(path);
  } catch {
    return false;
  }
}

export async function enrichRepoMetadata(
  treeMetadata: RepoScanMetadata,
  checkPath: (path: string) => Promise<boolean>
): Promise<RepoScanMetadata> {
  const [hasCI, hasDocker, hasSentry] = await Promise.all([
    treeMetadata.hasCI || verifyPathExists(checkPath, ".github/workflows"),
    treeMetadata.hasDocker || verifyPathExists(checkPath, "Dockerfile"),
    treeMetadata.hasSentry || verifyPathExists(checkPath, "sentry.config.js"),
  ]);

  return {
    ...treeMetadata,
    hasCI,
    hasDocker,
    hasSentry,
  };
}
