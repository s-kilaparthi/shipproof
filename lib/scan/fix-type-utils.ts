import type { FixType } from "@/types";

const VALID_FIX_TYPES: FixType[] = ["cursor", "sql", "terminal", "manual"];

export function normalizeFixType(value: unknown, fallback: FixType = "cursor"): FixType {
  const v = String(value ?? fallback).toLowerCase();
  if (VALID_FIX_TYPES.includes(v as FixType)) return v as FixType;
  return fallback;
}

export function inferFixTypeFromText(text: string): FixType {
  const lower = text.toLowerCase();

  if (
    /\bsql\b/.test(lower) ||
    /supabase/.test(lower) ||
    /rls/.test(lower) ||
    /policy/.test(lower) ||
    /migration/.test(lower)
  ) {
    return "sql";
  }

  if (
    /\bterminal\b/.test(lower) ||
    /\bnpm install\b/.test(lower) ||
    /\bpip install\b/.test(lower) ||
    /\byarn add\b/.test(lower) ||
    /\bnpx\b/.test(lower) ||
    /\brun:/.test(lower)
  ) {
    return "terminal";
  }

  if (
    /\bmanual\b/.test(lower) ||
    /dashboard/.test(lower) ||
    /settings/.test(lower) ||
    /hosting provider/.test(lower) ||
    /2fa/.test(lower) ||
    /ssl certificate/.test(lower)
  ) {
    return "manual";
  }

  return "cursor";
}

export function parseStepHeader(header: string): {
  filePath: string;
  fixType: FixType;
} {
  const trimmed = header.trim();
  const typedMatch = trimmed.match(/^(\w+)\s*\(([^)]+)\)$/i);

  if (typedMatch) {
    const typeHint = typedMatch[1].toLowerCase();
    const location = typedMatch[2].trim();

    if (typeHint === "sql") return { filePath: location, fixType: "sql" };
    if (typeHint === "terminal") return { filePath: location, fixType: "terminal" };
    if (typeHint === "manual") return { filePath: location, fixType: "manual" };
    if (typeHint === "cursor" || typeHint === "code") {
      return { filePath: location, fixType: "cursor" };
    }

    return {
      filePath: location,
      fixType: inferFixTypeFromText(`${typeHint} ${location}`),
    };
  }

  return {
    filePath: trimmed,
    fixType: inferFixTypeFromText(trimmed),
  };
}

export function getFixTypeBadgeLabel(fixType: FixType): string {
  switch (fixType) {
    case "sql":
      return "SQL Migration";
    case "terminal":
      return "Terminal Command";
    case "manual":
      return "Manual Setup";
    default:
      return "Code Fix";
  }
}

export function getFixTypeBadgeClass(fixType: FixType): string {
  void fixType;
  return "border border-border bg-muted text-foreground";
}

export function getCopyButtonLabel(fixType: FixType, tool: string): string {
  switch (fixType) {
    case "sql":
      return "Run in Supabase SQL Editor";
    case "terminal":
      return "Copy Command";
    case "manual":
      return "View Instructions";
    default:
      return `Paste into ${tool}`;
  }
}

export function extractTerminalCommand(fixPrompt: string): {
  explanation: string;
  command: string | null;
} {
  const runMatch = fixPrompt.match(/Run:\s*(.+)$/i);
  if (runMatch) {
    const command = runMatch[1].trim();
    const explanation = fixPrompt.slice(0, runMatch.index).trim();
    return { explanation, command };
  }

  const cmdMatch = fixPrompt.match(
    /(npm|yarn|pip|pnpm)\s+(install|update|run)[^.]*$/i
  );
  if (cmdMatch) {
    const command = cmdMatch[0].trim();
    const explanation = fixPrompt.slice(0, cmdMatch.index).trim();
    return { explanation, command };
  }

  return { explanation: fixPrompt, command: null };
}

export function getMultiStepIntro(fixTypes: FixType[], tool: string): string {
  const unique = Array.from(new Set(fixTypes));
  if (unique.length === 1 && unique[0] === "cursor") {
    return `This fix requires ${fixTypes.length} steps — paste each into ${tool} in order`;
  }
  return `This fix requires ${fixTypes.length} steps — complete each step in order using the tool shown`;
}
