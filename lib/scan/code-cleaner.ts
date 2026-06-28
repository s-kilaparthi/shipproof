import { isCriticalFile } from "./file-targeting";

const SECURITY_INLINE =
  /security|auth|authentication|authorization|rls|secret|token|password|credential/i;

const IMPORT_LINE = /^\s*import\s+/;
const CONSOLE_LOG = /^\s*console\.(log|debug|info|warn)\(/;
const TYPE_ONLY = /^\s*(export\s+)?(type|interface)\s+\w+/;
const CSS_CLASS = /className=|class=|@apply|tailwind|bg-|text-|flex |grid |p-\d|m-\d/;

function getMaxLines(filePath: string): number {
  return isCriticalFile(filePath) ? 150 : 80;
}

export function cleanCode(content: string, filePath: string): string {
  const maxLines = getMaxLines(filePath);
  const lines = content.split("\n");
  const cleaned: string[] = [];
  let inBlockComment = false;
  let consecutiveBlank = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inBlockComment) {
      if (SECURITY_INLINE.test(line)) cleaned.push(line);
      if (trimmed.includes("*/")) inBlockComment = false;
      continue;
    }

    if (trimmed.startsWith("/*")) {
      inBlockComment = !trimmed.includes("*/");
      if (SECURITY_INLINE.test(trimmed)) cleaned.push(line);
      continue;
    }

    if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
      if (SECURITY_INLINE.test(trimmed)) cleaned.push(line);
      continue;
    }

    if (IMPORT_LINE.test(trimmed)) continue;
    if (CONSOLE_LOG.test(trimmed)) continue;
    if (TYPE_ONLY.test(trimmed)) continue;
    if (CSS_CLASS.test(line) && !trimmed.includes("auth") && !trimmed.includes("api")) {
      continue;
    }

    if (trimmed === "") {
      consecutiveBlank++;
      if (consecutiveBlank <= 1) cleaned.push("");
      continue;
    }

    consecutiveBlank = 0;
    cleaned.push(line);
  }

  const truncated = cleaned.slice(0, maxLines);
  if (cleaned.length > maxLines) {
    truncated.push(`// ... truncated (${cleaned.length - maxLines} more lines)`);
  }

  return truncated.join("\n");
}

export function formatFilesAsMarkdown(
  files: { path: string; content: string }[]
): string {
  return files
    .map(
      (file) =>
        `## FILE: ${file.path}\n\`\`\`\n${cleanCode(file.content, file.path)}\n\`\`\``
    )
    .join("\n\n");
}
