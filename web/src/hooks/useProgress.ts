"use client";

import { useState, useEffect, useCallback } from "react";
import type { DealStatus } from "@/lib/types";

export function useProgress(dealName: string) {
  const [status, setStatus] = useState<DealStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealName}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch {}
  }, [dealName]);

  useEffect(() => {
    refresh();

    // Poll every 3s for status updates
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, refresh };
}
