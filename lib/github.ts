import { Octokit } from "octokit";

export function createOctokit(accessToken?: string) {
  return new Octokit({
    auth: accessToken ?? process.env.GITHUB_TOKEN,
  });
}

export const octokit = createOctokit();
