import type { Octokit } from "octokit";

import {
  EMPTY_DEVOPS_TOOLS,
  parseDevOpsToolsFromPackageJson,
} from "./discovery-parser";
import {
  isExcludedFile,
  parseRepoFullName,
  selectTargetFiles,
} from "./file-targeting";
import {
  detectRepoMetadataFromTree,
  enrichRepoMetadata,
  mergeDevOpsTools,
} from "./repo-metadata";
import type { ParsedDiscovery } from "./discovery-parser";
import type { DevOpsTools, RepoScanMetadata } from "@/types";

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

export interface FetchedFile {
  path: string;
  content: string;
}

export interface FetchTargetedFilesResult {
  files: FetchedFile[];
  metadata: RepoScanMetadata;
  devopsTools: DevOpsTools;
  allFilePaths: string[];
  fetchedPaths: string[];
}

export async function fetchRepoFileTree(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string[]> {
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "true",
  });

  return (treeData.tree ?? [])
    .filter((item) => item.type === "blob" && item.path)
    .map((item) => item.path as string)
    .filter((path) => !isExcludedFile(path));
}

async function pathExistsOnGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<boolean> {
  try {
    await withRetry(() =>
      octokit.rest.repos.getContent({ owner, repo, path })
    );
    return true;
  } catch {
    return false;
  }
}

export async function fetchFileContents(
  octokit: Octokit,
  owner: string,
  repo: string,
  paths: string[]
): Promise<FetchedFile[]> {
  const files: FetchedFile[] = [];

  for (const path of paths) {
    if (isExcludedFile(path)) continue;

    try {
      const { data } = await withRetry(() =>
        octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        })
      );

      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        continue;
      }

      const content = Buffer.from(data.content, "base64").toString("utf-8");

      if (content.length > 80_000) continue;

      files.push({ path, content });
    } catch {
      // Skip unreadable files
    }
  }

  return files;
}

function parseDevOpsToolsFromFiles(
  files: FetchedFile[],
  treeMetadata: RepoScanMetadata
): DevOpsTools {
  const packageFile = files.find(
    (file) => file.path === "package.json" || file.path.endsWith("/package.json")
  );

  const fromPackage = packageFile
    ? parseDevOpsToolsFromPackageJson(packageFile.content, {
        hasCI: treeMetadata.hasCI,
        hasDocker: treeMetadata.hasDocker,
        hasSentry: treeMetadata.hasSentry,
        hasTests: treeMetadata.hasTests,
      })
    : EMPTY_DEVOPS_TOOLS;

  return mergeDevOpsTools(treeMetadata, fromPackage);
}

export async function fetchTargetedFiles(
  octokit: Octokit,
  repoName: string,
  parsed: ParsedDiscovery,
  maxFiles = 15
): Promise<FetchTargetedFilesResult> {
  const { owner, repo } = parseRepoFullName(repoName);
  const allFilePaths = await fetchRepoFileTree(octokit, owner, repo);
  const treeMetadata = detectRepoMetadataFromTree(allFilePaths);

  const metadata = await enrichRepoMetadata(treeMetadata, (path) =>
    pathExistsOnGitHub(octokit, owner, repo, path)
  );

  const targetPaths = selectTargetFiles(allFilePaths, parsed, maxFiles);
  const files = await fetchFileContents(octokit, owner, repo, targetPaths);
  const devopsTools = parseDevOpsToolsFromFiles(files, metadata);

  return {
    files,
    metadata,
    devopsTools,
    allFilePaths,
    fetchedPaths: files.map((file) => file.path),
  };
}
