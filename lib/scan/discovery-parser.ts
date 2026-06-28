export interface ParsedDiscovery {
  raw: string;
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    auth?: string;
    hosting?: string;
    raw?: string;
  };
  apiRoutes: string[];
  databaseTables: string[];
  environmentVariables: string[];
  securityMeasures: string[];
  summary: string;
}

function extractSection(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return "";
}

function extractListItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 2);
}

export function parseDiscoveryResponse(discoveryResponse: string): ParsedDiscovery {
  const raw = discoveryResponse.trim();

  const techStackRaw = extractSection(raw, [
    /(?:1\.?\s*)?tech\s*stack[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /frontend[^:]*:[^\n]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const apiRoutesRaw = extractSection(raw, [
    /(?:3\.?\s*)?(?:all\s*)?api\s*routes?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
    /endpoints?[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const tablesRaw = extractSection(raw, [
    /(?:4\.?\s*)?database\s*tables?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const envRaw = extractSection(raw, [
    /(?:5\.?\s*)?environment\s*variable[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const securityRaw = extractSection(raw, [
    /(?:7\.?\s*)?(?:existing\s*)?security\s*measures?[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const summaryRaw = extractSection(raw, [
    /(?:2\.?\s*)?what\s*this\s*app\s*does[^:]*:[:\s]*([\s\S]*?)(?=\n\s*\d+\.|$)/i,
  ]);

  const techStack = {
    raw: techStackRaw || raw.slice(0, 500),
    frontend: techStackRaw.match(/frontend[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    backend: techStackRaw.match(/backend[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    database: techStackRaw.match(/database[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    auth: techStackRaw.match(/auth[:\s]*([^\n,]+)/i)?.[1]?.trim(),
    hosting: techStackRaw.match(/hosting[:\s]*([^\n,]+)/i)?.[1]?.trim(),
  };

  return {
    raw,
    techStack,
    apiRoutes: extractListItems(apiRoutesRaw),
    databaseTables: extractListItems(tablesRaw),
    environmentVariables: extractListItems(envRaw),
    securityMeasures: extractListItems(securityRaw),
    summary: summaryRaw || "No summary provided",
  };
}

export function discoveryToMarkdown(parsed: ParsedDiscovery): string {
  return `### Tech Stack
- Frontend: ${parsed.techStack.frontend ?? "Unknown"}
- Backend: ${parsed.techStack.backend ?? "Unknown"}
- Database: ${parsed.techStack.database ?? "Unknown"}
- Auth: ${parsed.techStack.auth ?? "Unknown"}
- Hosting: ${parsed.techStack.hosting ?? "Unknown"}

### API Routes
${parsed.apiRoutes.length > 0 ? parsed.apiRoutes.map((r) => `- ${r}`).join("\n") : "- None identified"}

### Database Tables
${parsed.databaseTables.length > 0 ? parsed.databaseTables.map((t) => `- ${t}`).join("\n") : "- None identified"}

### Environment Variables
${parsed.environmentVariables.length > 0 ? parsed.environmentVariables.map((e) => `- ${e}`).join("\n") : "- None identified"}

### Security Measures
${parsed.securityMeasures.length > 0 ? parsed.securityMeasures.map((s) => `- ${s}`).join("\n") : "- None identified"}

### App Summary
${parsed.summary}`;
}
