export const SEVERITY_RULES: Record<string, "critical" | "warning" | "info"> = {
  // Security - Critical
  "no authentication": "critical",
  unauthenticated: "critical",
  "no auth": "critical",
  rls: "critical",
  "row level security": "critical",
  "exposed secret": "critical",
  hardcoded: "critical",
  "cors wildcard": "critical",
  cors: "critical",
  "no rate limiting": "critical",
  "rate limit": "critical",
  "sql injection": "critical",
  "exposed api key": "critical",

  // Security - Warning
  "error details leaked": "warning",
  "exception details": "warning",
  "file upload validation": "warning",
  "content-type": "warning",
  "predictable password": "warning",

  // Database - Warning
  "no pagination": "warning",
  pagination: "warning",
  "n+1": "warning",
  "select *": "warning",
  unbounded: "warning",
  "no connection pool": "warning",

  // Database - Info
  "missing index": "info",
  index: "info",

  // Performance - Warning
  "no caching": "warning",
  "no cdn": "info",

  // Reliability - Warning
  "no error handling": "warning",
  "no health check": "warning",
  "no retry": "info",
  "no timeout": "info",

  // Observability - Warning
  "no logging": "warning",
  "no monitoring": "warning",
  "no error monitoring": "warning",
  "print()": "warning",

  // DevOps - Warning/Info
  "no ci/cd": "info",
  "no environment": "warning",
  "no rate limit": "critical",

  // Dependencies
  "vulnerable dependency": "info",
};

export function applySeverityRules(
  issueName: string,
  description: string,
  claudeSeverity: "critical" | "warning" | "info"
): "critical" | "warning" | "info" {
  const text = (issueName + " " + description).toLowerCase();

  for (const [keyword, severity] of Object.entries(SEVERITY_RULES)) {
    if (text.includes(keyword.toLowerCase())) {
      return severity;
    }
  }

  return claudeSeverity;
}
