"use client";

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GitHubRepo } from "@/types";

interface RepoSelectorProps {
  selectedRepo: GitHubRepo | null;
  domain: string;
  onSelect: (repo: GitHubRepo) => void;
  onDomainChange: (domain: string) => void;
  onNext: () => void;
}

export function RepoSelector({
  selectedRepo,
  domain,
  onSelect,
  onDomainChange,
  onNext,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repos");
      const data = (await response.json()) as {
        repos?: GitHubRepo[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load repositories");
      }

      setRepos(data.repos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return repos;

    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query)
    );
  }, [repos, search]);

  return (
    <Card className="flex h-full min-h-0 flex-col shadow-none">
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <CardTitle className="text-lg">Select a GitHub repository</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the repository you want to scan for security issues.
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-0">
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading repositories...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchRepos}
              >
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && filteredRepos.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No repositories found.
            </p>
          )}

          {!loading && !error && filteredRepos.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {filteredRepos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;

                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => onSelect(repo)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      isSelected
                        ? "border-2 border-black bg-muted/50 dark:border-white"
                        : "border-gray-200 dark:border-gray-800"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {repo.full_name}
                      </span>
                      <Badge variant={repo.private ? "secondary" : "outline"}>
                        {repo.private ? "Private" : "Public"}
                      </Badge>
                    </div>
                    {repo.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
          <label htmlFor="app-domain" className="text-sm font-medium">
            App domain (optional)
          </label>
          <Input
            id="app-domain"
            placeholder="https://yourapp.com"
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Check SSL and security headers
          </p>
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
          <Button type="button" onClick={onNext} disabled={!selectedRepo || loading}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
