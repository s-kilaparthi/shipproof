"use client";

import { useEffect, useState } from "react";

import { getFixedIssueCount } from "@/lib/scan/fixed-issues";

interface FixedIssueCountProps {
  scanId: string;
}

export function FixedIssueCount({ scanId }: FixedIssueCountProps) {
  const [fixedCount, setFixedCount] = useState(0);

  useEffect(() => {
    setFixedCount(getFixedIssueCount(scanId));
  }, [scanId]);

  if (fixedCount === 0) return null;

  return <span className="text-green-600"> · {fixedCount} fixed</span>;
}
