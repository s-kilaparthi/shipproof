"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FixedIssueCount } from "@/components/dashboard/fixed-issue-count";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardScoreBadgeClass, getPillarDisplayScore, getPillarDotColor } from "@/lib/scan/health-score";
import { clearFixedIssues } from "@/lib/scan/fixed-issues";
import { DISPLAY_PILLARS, type PillarScores, type Tool } from "@/types";

interface ScanRecord {
  id: string;
  tool_selected: string;
  status: string;
  created_at: string;
  repo_name: string;
}

interface ScanHistoryItem {
  scan: ScanRecord;
  issueCount: number;
  pillarScores: PillarScores;
}

interface RepoGroup {
  repoName: string;
  scans: ScanHistoryItem[];
  canQuickRescan: boolean;
}

interface ScanHistoryProps {
  repoGroups: RepoGroup[];
}

interface ConfirmState {
  type: "single" | "repo";
  scanId?: string;
  repoName?: string;
  scanCount?: number;
}

function ConfirmDialog({
  open,
  title,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-card p-6 shadow-lg dark:border-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <p className="text-sm text-foreground">{title}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ScanHistory({ repoGroups }: ScanHistoryProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteScan = async (scanId: string) => {
    const res = await fetch(`/api/scan/${scanId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to delete scan");
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;

    setIsDeleting(true);
    try {
      if (confirm.type === "single" && confirm.scanId) {
        await deleteScan(confirm.scanId);
        toast.success("Scan deleted");
      } else if (confirm.type === "repo" && confirm.repoName) {
        const group = repoGroups.find((g) => g.repoName === confirm.repoName);
        if (group) {
          await Promise.all(group.scans.map((s) => deleteScan(s.scan.id)));
          toast.success(`Deleted ${group.scans.length} scan(s)`);
        }
      }
      setConfirm(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmTitle =
    confirm?.type === "single"
      ? "Delete this scan report? This cannot be undone."
      : confirm?.repoName
        ? `Delete all ${confirm.scanCount} scan${confirm.scanCount === 1 ? "" : "s"} for ${confirm.repoName}? This cannot be undone.`
        : "";

  return (
    <>
      <ConfirmDialog
        open={confirm !== null}
        title={confirmTitle}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
        isDeleting={isDeleting}
      />

      <div className="mt-12 space-y-8">
        <h2 className="text-lg font-semibold text-foreground">Scan History</h2>
        {repoGroups.map(({ repoName, scans, canQuickRescan }) => {
          const rescanMode = canQuickRescan ? "quick" : "full";
          const rescanLabel = canQuickRescan ? "Quick Rescan" : "Rescan";

          return (
            <div key={repoName} className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-foreground">{repoName}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {scans.length} scan{scans.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() =>
                      setConfirm({
                        type: "repo",
                        repoName,
                        scanCount: scans.length,
                      })
                    }
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                {scans.map(({ scan, issueCount, pillarScores }) => (
                  <Card
                    key={scan.id}
                    className="group relative border border-gray-200 ring-0 dark:border-gray-800"
                  >
                    <button
                      type="button"
                      aria-label="Delete scan"
                      className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      onClick={() =>
                        setConfirm({ type: "single", scanId: scan.id })
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2 pr-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{scan.tool_selected as Tool}</Badge>
                          <Badge
                            variant={
                              scan.status === "completed"
                                ? "secondary"
                                : scan.status === "failed"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {scan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {issueCount > 0 && (
                            <>
                              {" "}
                              · {issueCount} issue{issueCount === 1 ? "" : "s"}
                              <FixedIssueCount scanId={scan.id} />
                            </>
                          )}
                        </p>
                        {scan.status === "completed" && (
                          <div className="flex items-center gap-1.5 pl-2">
                            {DISPLAY_PILLARS.map(({ id, label }) => (
                              <span
                                key={id}
                                title={`${label}: ${getPillarDisplayScore(pillarScores[id])}`}
                                className={`size-2.5 shrink-0 rounded-full ${getPillarDotColor(pillarScores[id])}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {scan.status === "completed" && (
                          <div className={getDashboardScoreBadgeClass(pillarScores.overall)}>
                            {pillarScores.overall}
                          </div>
                        )}
                        {scan.status === "completed" ? (
                          <>
                            <Link href={`/scan/${scan.id}/report`}>
                              <Button variant="outline" size="sm">
                                View Report
                              </Button>
                            </Link>
                            <Link
                              href={`/scan/new?repo=${encodeURIComponent(repoName)}&mode=${rescanMode}`}
                              onClick={() => clearFixedIssues(scan.id)}
                            >
                              <Button variant="outline" size="sm" className="gap-1.5">
                                {canQuickRescan ? (
                                  <Zap className="size-3.5" />
                                ) : (
                                  <RefreshCw className="size-3.5" />
                                )}
                                {rescanLabel}
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            {scan.status === "scanning" ? "Scanning..." : "View Report"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
