"use client";

import { useState } from "react";
import { ProgressTracker } from "./ProgressTracker";
import { FileUpload } from "./FileUpload";
import type { DealStatus } from "@/lib/types";

type PipelineType = "screening" | "fund" | "deep" | "update";

export function RunControls({
  dealName,
  status,
  stage,
  hasScreening,
  completedFiles,
  onRunStarted,
  onUploadComplete,
}: {
  dealName: string;
  status: DealStatus;
  stage: "none" | "screening" | "deep";
  hasScreening: boolean;
  completedFiles: string[];
  onRunStarted: () => void;
  onUploadComplete: () => void;
}) {
  const [pipelineType, setPipelineType] = useState<PipelineType>(
    hasScreening ? "deep" : "screening"
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState("");

  const isRunning = status.state === "running";

  async function triggerRun() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealName}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: pipelineType, context: context.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start pipeline");
      }
      onRunStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline type selector */}
      {!isRunning && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
            Pipeline Type
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="pipeline"
                value="screening"
                checked={pipelineType === "screening"}
                onChange={() => setPipelineType("screening")}
                className="accent-blue"
              />
              <div>
                <div className="font-medium text-sm">Run Screening</div>
                <div className="text-xs text-muted">
                  7-phase analysis from pitch materials
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="pipeline"
                value="fund"
                checked={pipelineType === "fund"}
                onChange={() => setPipelineType("fund")}
                className="accent-blue"
              />
              <div>
                <div className="font-medium text-sm">Run Fund Evaluation</div>
                <div className="text-xs text-muted">
                  5P framework for fund/GP materials
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer ${
                !hasScreening
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="pipeline"
                value="deep"
                checked={pipelineType === "deep"}
                onChange={() => setPipelineType("deep")}
                disabled={!hasScreening}
                className="accent-blue"
              />
              <div>
                <div className="font-medium text-sm">Run Deep Diligence</div>
                <div className="text-xs text-muted">
                  {hasScreening
                    ? "Phases 8-9 with data room materials"
                    : "Requires completed screening first"}
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer ${
                !hasScreening
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="pipeline"
                value="update"
                checked={pipelineType === "update"}
                onChange={() => setPipelineType("update")}
                disabled={!hasScreening}
                className="accent-blue"
              />
              <div>
                <div className="font-medium text-sm">Update with New Documents</div>
                <div className="text-xs text-muted">
                  {hasScreening
                    ? "Analyze new documents (PPM, terms, financials) and update the memo"
                    : "Requires completed screening first"}
                </div>
              </div>
            </label>
          </div>

          {/* Supplementary context */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Additional Context
              <span className="normal-case tracking-normal font-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add info from founder calls, updated numbers, or specific areas to focus on..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue/40 resize-none"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
            <strong>Before you start:</strong> Runs take 20-40 minutes and use
            Claude credits (~$5-15 per run depending on deal complexity). The
            pipeline cannot be stopped once started.
          </div>

          <button
            onClick={triggerRun}
            disabled={starting}
            className="w-full py-2.5 px-4 bg-navy text-white rounded-lg font-medium hover:bg-blue transition-colors disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Pipeline"}
          </button>
        </div>
      )}

      {/* Progress tracker */}
      {(isRunning || status.state === "complete") && (
        <div>
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
            Progress
          </h3>
          <ProgressTracker
            completedFiles={completedFiles}
            stage={status.stage}
            state={status.state}
          />
          {isRunning && (
            <p className="text-xs text-muted mt-4 animate-pulse">
              This typically takes 30-40 minutes. You can close this page and come back — the pipeline runs in the background.
            </p>
          )}
        </div>
      )}

      {/* Error display */}
      {status.state === "failed" && status.error && (
        <div className="p-4 bg-vc-red/10 border border-vc-red/20 rounded-lg">
          <p className="text-sm font-medium text-vc-red">Pipeline Failed</p>
          <p className="text-xs text-muted mt-1">{status.error}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-vc-red/10 border border-vc-red/20 rounded-lg">
          <p className="text-sm text-vc-red">{error}</p>
        </div>
      )}

      {/* Data room upload */}
      <div>
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
          Upload Files
        </h3>
        <FileUpload
          dealName={dealName}
          onUploadComplete={onUploadComplete}
          label="Drop data room files here"
        />
      </div>
    </div>
  );
}
