import { writeStatus } from "./status";
import { PROJECT_ROOT, DEALS_DIR } from "./paths";
import { spawn } from "child_process";
import path from "path";

export type PipelineType = "screening" | "fund" | "deep" | "update";

/**
 * Spawns the pipeline as a fully detached process so the Next.js server
 * is never blocked. A wrapper script handles status.json updates and
 * deliverable generation.
 */
export function runPipeline(dealName: string, pipelineType: PipelineType, context?: string): void {
  const stage = pipelineType === "deep" ? 2 : 1;

  writeStatus(dealName, {
    state: "running",
    stage: stage as 1 | 2,
    currentPhase: "Starting pipeline...",
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  });

  // Spawn the runner script as a fully detached process
  const child = spawn(
    "node",
    [path.join(PROJECT_ROOT, "web", "scripts", "run-pipeline.js"), dealName, pipelineType],
    {
      cwd: PROJECT_ROOT,
      stdio: "ignore",
      detached: true,
      env: {
        ...process.env,
        ...(context ? { PIPELINE_CONTEXT: context } : {}),
      },
    }
  );

  // Unref so the Next.js process doesn't wait for it
  child.unref();
}
