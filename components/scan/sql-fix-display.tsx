"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  buildMigrationCreateFilePrompt,
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

const CODE_BLOCK =
  "max-h-64 overflow-x-auto border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-900";

const COPY_BTN =
  "inline-flex items-center gap-1.5 border border-gray-200 bg-transparent px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800";

async function copyText(text: string, successMessage: string) {
  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
}

export function SqlFixDisplay({ issue, tool }: SqlFixDisplayProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const migrationSlug = normalizeMigrationFilename(
    issue.migration_filename,
    issue.issue_name
  );
  const filePath = buildMigrationFilePath(
    migrationSlug,
    getMigrationTimestamp()
  );
  const displayDate = formatMigrationDate();

  const { sqlContent, createFilePrompt } = useMemo(() => {
    const sql = extractSqlContent(issue.fix_prompt);
    return {
      sqlContent: sql,
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
    <div className="space-y-5">
      <section className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Run in Supabase SQL Editor
        </h4>
        <pre className={CODE_BLOCK}>{sqlContent}</pre>
        <button
          type="button"
          className={COPY_BTN}
          onClick={() =>
            handleCopy(sqlContent, "SQL copied to clipboard", setCopiedSql)
          }
        >
          {copiedSql ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy SQL
            </>
          )}
        </button>
      </section>

      <section className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Save this fix to your repo
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Paste this into {tool} so it creates the migration file automatically:
        </p>
        <pre className={CODE_BLOCK}>{createFilePrompt}</pre>
        <button
          type="button"
          className={COPY_BTN}
          onClick={() =>
            handleCopy(
              createFilePrompt,
              `Prompt copied — paste into ${tool}`,
              setCopiedPrompt
            )
          }
        >
          {copiedPrompt ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy Prompt
            </>
          )}
        </button>
      </section>
    </div>
  );
}
