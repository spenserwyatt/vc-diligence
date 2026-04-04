import fs from "fs";
import path from "path";
import { DEALS_DIR } from "./paths";
import type { DealStatus } from "./types";

export type { DealStatus };

const DEFAULT_STATUS: DealStatus = {
  state: "idle",
  stage: null,
  currentPhase: null,
  startedAt: null,
  completedAt: null,
  error: null,
};

export function readStatus(dealName: string): DealStatus {
  const statusPath = path.join(DEALS_DIR, dealName, "status.json");
  try {
    const raw = fs.readFileSync(statusPath, "utf-8");
    const status: DealStatus = { ...DEFAULT_STATUS, ...JSON.parse(raw) };

    // Stale-run detection: if running for > 60 min, mark as stale
    if (
      status.state === "running" &&
      status.startedAt &&
      Date.now() - new Date(status.startedAt).getTime() > 60 * 60 * 1000
    ) {
      status.state = "failed";
      status.error = "Run appears stale (>60 min with no completion)";
    }

    return status;
  } catch {
    return { ...DEFAULT_STATUS };
  }
}

export function writeStatus(
  dealName: string,
  updates: Partial<DealStatus>
): void {
  const statusPath = path.join(DEALS_DIR, dealName, "status.json");
  const current = readStatus(dealName);
  const merged = { ...current, ...updates };
  fs.writeFileSync(statusPath, JSON.stringify(merged, null, 2));
}
