export type UserPlan = "free" | "launch" | "starter" | "pro" | string;

export interface ScanLimitStatus {
  plan: UserPlan;
  total_scans_used: number;
  limit: number;
  scans_remaining: number;
  can_scan: boolean;
}

/** Plan scan limits. `-1` means unlimited. */
export const PLAN_SCAN_LIMITS: Record<string, number> = {
  free: 1,
  launch: 3,
  starter: 3,
  pro: -1,
};

export function getPlanScanLimit(plan: string | null | undefined): number {
  const key = (plan ?? "free").toLowerCase();
  return PLAN_SCAN_LIMITS[key] ?? PLAN_SCAN_LIMITS.free;
}

export function getScanLimitStatus(
  plan: string | null | undefined,
  totalScansUsed: number | null | undefined
): ScanLimitStatus {
  const normalizedPlan = (plan ?? "free").toLowerCase();
  const used = Math.max(0, totalScansUsed ?? 0);
  const limit = getPlanScanLimit(normalizedPlan);
  const unlimited = limit < 0;
  const scansRemaining = unlimited ? -1 : Math.max(0, limit - used);
  const canScan = unlimited || used < limit;

  return {
    plan: normalizedPlan,
    total_scans_used: used,
    limit,
    scans_remaining: scansRemaining,
    can_scan: canScan,
  };
}
