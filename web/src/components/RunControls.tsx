"use client";

import { useState } from "react";
import { ProgressTracker } from "./ProgressTracker";
import { FileUpload } from "./FileUpload";
import type { DealStatus } from "@/lib/types";

type PipelineType = "quick" | "screening" | "fund" | "deep" | "update";

// Detect deal state from completed files
function detectState(completedFiles: string[]) {
  const hasFullDeal = completedFiles.some((f) => /^0[1-4]-/.test(f));
  const hasFullFund = completedFiles.some((f) => /^P\d-/.test(f));
  const hasQuickScreen = completedFiles.includes("07-memo.md") || completedFiles.includes("fund-memo.md");
  const hasDeep = completedFiles.some((f) => /^0[89]-/.test(f));

  if (hasDeep) return "deep-complete";
  if (hasFullDeal || hasFullFund) return "full-complete";
  if (hasQuickScreen) return "quick-complete";
  return "new";
}

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
  const dealState = detectState(completedFiles);
  const [pipelineType, setPipelineType] = useState<PipelineType>("quick");
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

  // Build contextual options based on deal state
  function renderOptions() {
    switch (dealState) {
      case "new":
        return (
          <>
            <Option
              value="quick"
              label="Quick Screen"
              description="Fast first read — is this worth a meeting? (~5 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="screening"
              label="Full Deal Analysis"
              description="Deep multi-agent pipeline with scoring (~35-50 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="fund"
              label="Full Fund Evaluation"
              description="5P framework for fund/GP materials (~35-50 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
          </>
        );

      case "quick-complete":
        return (
          <>
            <Option
              value="screening"
              label="Run Full Deal Analysis"
              description="Go deeper — scored assessment with stress-tested financials (~35-50 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="fund"
              label="Run Full Fund Evaluation"
              description="Go deeper — 5P framework with scoring (~35-50 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="quick"
              label="Re-run Quick Screen"
              description="New documents added? Re-run the fast first read (~5 min)"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
          </>
        );

      case "full-complete":
        return (
          <>
            <Option
              value="update"
              label="Update with New Documents"
              description="Analyze new docs (PPM, terms, financials) and update the memo"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="deep"
              label="Run Deep Diligence"
              description="Phases 8-9 with data room materials"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="screening"
              label="Re-run Full Analysis"
              description="Start fresh with all current materials"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
          </>
        );

      case "deep-complete":
        return (
          <>
            <Option
              value="update"
              label="Update with New Documents"
              description="Analyze additional documents"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
            <Option
              value="screening"
              label="Re-run Full Analysis"
              description="Start fresh with all current materials"
              selected={pipelineType}
              onSelect={setPipelineType}
            />
          </>
        );
    }
  }

  const timeEstimate =
    pipelineType === "quick"
      ? "~5 minutes"
      : pipelineType === "update"
        ? "~15-20 minutes"
        : "~35-50 minutes";

  return (
    <div className="space-y-6">
      {/* Pipeline options */}
      {!isRunning && (
        <div className="space-y-3">
          <div className="space-y-2">{renderOptions()}</div>

          {/* Supplementary context */}
          {pipelineType !== "quick" && (
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
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
            Estimated time: {timeEstimate}.{" "}
            {pipelineType === "quick"
              ? "Run Full Analysis later for scored assessment."
              : "Cannot be stopped once started. Runs in the background."}
          </div>

          <button
            onClick={triggerRun}
            disabled={starting}
            className="w-full py-2.5 px-4 bg-navy text-white rounded-lg font-medium hover:bg-blue transition-colors disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start"}
          </button>
        </div>
      )}

      {/* Progress tracker */}
      {(isRunning || status.state === "complete") && (
        <div>
          <ProgressTracker
            completedFiles={completedFiles}
            stage={status.stage}
            state={status.state}
          />
          {isRunning && (
            <p className="text-xs text-muted mt-4 animate-pulse">
              This runs in the background — you can close this page and come back.
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

      {/* File upload */}
      <div>
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
          Upload Files
        </h3>
        <FileUpload
          dealName={dealName}
          onUploadComplete={onUploadComplete}
          label="Drop files here (decks, PPMs, term sheets, data room docs)"
        />
      </div>
    </div>
  );
}

function Option({
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  value: PipelineType;
  label: string;
  description: string;
  selected: PipelineType;
  onSelect: (v: PipelineType) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
      <input
        type="radio"
        name="pipeline"
        value={value}
        checked={selected === value}
        onChange={() => onSelect(value)}
        className="accent-blue"
      />
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
    </label>
  );
}
