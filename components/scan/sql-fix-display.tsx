"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildMigrationCreateFilePrompt,
  buildMigrationFileContent,
  buildMigrationFilePath,
  extractSqlContent,
  formatMigrationDate,
  getMigrationTimestamp,
  normalizeMigrationFilename,
} from "@/lib/scan/sql-migration-utils";
import type { ScanIssueRow, Tool } from "@/types";

interface SqlFixDisplayProps {
  issue: ScanIssueRow;
  tool: Tool;
}

async function copyText(text: string, successMessage: string) {
  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
}

export function SqlFixDisplay({ issue, tool }: SqlFixDisplayProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedMigration, setCopiedMigration] = useState(false);
  const [copiedCreatePrompt, setCopiedCreatePrompt] = useState(false);

  const migrationSlug = normalizeMigrationFilename(
    issue.migration_filename,
    issue.issue_name
  );
  const timestamp = getMigrationTimestamp();
  const displayDate = formatMigrationDate();
  const filePath = buildMigrationFilePath(migrationSlug, timestamp);

  const { sqlContent, migrationFileContent, createFilePrompt } = useMemo(() => {
    const sql = extractSqlContent(issue.fix_prompt);
    return {
      sqlContent: sql,
      migrationFileContent: buildMigrationFileContent(
        issue.issue_name,
        sql,
        displayDate
      ),
      createFilePrompt: buildMigrationCreateFilePrompt(
        tool,
        filePath,
        issue.issue_name,
        sql,
        displayDate
      ),
    };
  }, [issue.fix_prompt, issue.issue_name, tool, filePath, displayDate]);

  const handleCopy = async (
    text: string,
    message: string,
    setCopied: (value: boolean) => void
  ) => {
    try {
      await copyText(text, message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1 — Run in Supabase SQL Editor */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Run in Supabase SQL Editor
        </h4>
        <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {sqlContent}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => handleCopy(sqlContent, "SQL copied to clipboard", setCopiedSql)}
        >
          {copiedSql ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy SQL
            </>
          )}
        </Button>
      </section>

      {/* Section 2 — Save to your repo */}
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          Save to your repo (recommended)
        </h4>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Add this as a migration file so ShipProof won&apos;t flag this issue on
          future scans.
        </p>
        <p className="font-mono text-xs text-muted-foreground break-all">
          {filePath}
        </p>
        <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {migrationFileContent}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            handleCopy(
              migrationFileContent,
              "Migration file copied to clipboard",
              setCopiedMigration
            )
          }
        >
          {copiedMigration ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy Migration File
            </>
          )}
        </Button>
      </section>

      {/* Section 3 — Paste into AI tool */}
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          Paste into {tool} to create the file
        </h4>
        <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap">
          {createFilePrompt}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            handleCopy(
              createFilePrompt,
              `Create-file prompt copied for ${tool}`,
              setCopiedCreatePrompt
            )
          }
        >
          {copiedCreatePrompt ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy Prompt
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
