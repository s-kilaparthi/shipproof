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
    <Card>
      <CardHeader>
        <CardTitle>Select a GitHub repository</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the repository you want to scan for security issues.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          We request GitHub&apos;s repo scope (required for private repos) but
          ShipProof&apos;s code only ever calls read endpoints — never write or
          delete.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading your repositories...</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchRepos}
            >
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && filteredRepos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No repositories found.
          </p>
        )}

        {!loading && !error && filteredRepos.length > 0 && (
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;

              return (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => onSelect(repo)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-all hover:bg-muted/50",
                    isSelected
                      ? "border-2 border-black bg-muted/50 dark:border-white"
                      : "border-gray-200 hover:shadow-sm dark:border-gray-800"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{repo.full_name}</span>
                    <Badge variant={repo.private ? "secondary" : "outline"}>
                      {repo.private ? "Private" : "Public"}
                    </Badge>
                  </div>
                  {repo.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {repo.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated{" "}
                    {new Date(repo.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          <label htmlFor="app-domain" className="text-sm font-medium">
            App Domain (optional)
          </label>
          <Input
            id="app-domain"
            placeholder="https://yourapp.com"
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Add your domain to check SSL and security headers
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onNext} disabled={!selectedRepo || loading}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
