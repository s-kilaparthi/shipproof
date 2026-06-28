import type { Octokit } from "octokit";

import {
  isExcludedFile,
  parseRepoFullName,
  selectTargetFiles,
} from "./file-targeting";
import type { ParsedDiscovery } from "./discovery-parser";

export interface FetchedFile {
  path: string;
  content: string;
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
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

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

export async function fetchTargetedFiles(
  octokit: Octokit,
  repoName: string,
  parsed: ParsedDiscovery,
  maxFiles = 8
): Promise<FetchedFile[]> {
  const { owner, repo } = parseRepoFullName(repoName);
  const allFiles = await fetchRepoFileTree(octokit, owner, repo);
  const targetPaths = selectTargetFiles(allFiles, parsed, maxFiles);

  return fetchFileContents(octokit, owner, repo, targetPaths);
}
