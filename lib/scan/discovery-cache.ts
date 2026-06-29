export const DISCOVERY_CACHE_DAYS = 7;

export function getDiscoveryReferenceDate(scan: {
  discovery_cached_at?: string | null;
  created_at: string;
}): Date {
  if (scan.discovery_cached_at) {
    return new Date(scan.discovery_cached_at);
  }
  return new Date(scan.created_at);
}

export function getDiscoveryAgeDays(referenceDate: Date, now = new Date()): number {
  const diffMs = now.getTime() - referenceDate.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

export function requiresFreshDiscovery(discoveryAgeDays: number): boolean {
  return discoveryAgeDays > DISCOVERY_CACHE_DAYS;
}

export function formatDiscoveryAge(referenceDate: Date, now = new Date()): string {
  const diffMs = now.getTime() - referenceDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) return "less than an hour ago";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function formatDiscoveryAgeDays(days: number): string {
  if (days < 1 / 24) return "less than an hour ago";
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const rounded = Math.floor(days);
  if (rounded === 1) return "1 day ago";
  return `${rounded} days ago`;
}

export function isQuickRescanScan(scan: {
  discovery_cached_at?: string | null;
  created_at: string;
}): boolean {
  if (!scan.discovery_cached_at) return false;

  const cachedAt = new Date(scan.discovery_cached_at).getTime();
  const createdAt = new Date(scan.created_at).getTime();

  return createdAt - cachedAt > 60 * 60 * 1000;
}
