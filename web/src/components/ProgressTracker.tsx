"use client";

const DEAL_PHASES = [
  { num: 1, file: "01-extraction.md", label: "Phase 1: Claim Extraction" },
  { num: 2, file: "02-market.md", label: "Phase 2: Market Interrogation" },
  { num: 3, file: "03-team.md", label: "Phase 3: Team Assessment" },
  { num: 4, file: "04-financials.md", label: "Phase 4: Financial Stress Test" },
  { num: 5, file: "05-terms.md", label: "Phase 5: Terms Analysis" },
  { num: 6, file: "06-impact.md", label: "Phase 6: Impact Analysis" },
  { num: 7, file: "07-memo.md", label: "Phase 7: Synthesis & Review" },
  { num: 8, file: "08-data-room-analysis.md", label: "Phase 8: Data Room Analysis" },
  { num: 9, file: "09-full-report.md", label: "Phase 9: Full Report" },
];

const FUND_PHASES = [
  { num: 1, file: "deck-extracted.md", label: "Extraction" },
  { num: 2, file: "P1-people.md", label: "P1: People Assessment" },
  { num: 3, file: "P2-philosophy.md", label: "P2: Philosophy Assessment" },
  { num: 4, file: "P3-process.md", label: "P3: Process Assessment" },
  { num: 5, file: "P4-portfolio.md", label: "P4: Portfolio Assessment" },
  { num: 6, file: "P5-performance.md", label: "P5: Performance Assessment" },
  { num: 7, file: "fund-memo.md", label: "Synthesis & Review" },
];

function isFundDeal(completedFiles: string[]): boolean {
  return completedFiles.some(
    (f) => f.startsWith("P") || f === "fund-memo.md" || f === "deck-extracted.md"
  );
}

export function ProgressTracker({
  completedFiles,
  stage,
  state,
}: {
  completedFiles: string[];
  stage: 1 | 2 | null;
  state: "idle" | "running" | "complete" | "failed";
}) {
  const isFund = isFundDeal(completedFiles);
  const allPhases = isFund ? FUND_PHASES : DEAL_PHASES;
  const phases = !isFund && stage === 2 ? allPhases : isFund ? allPhases : allPhases.slice(0, 7);
  const fileSet = new Set(completedFiles);

  // Find the highest completed phase index
  let highestDone = -1;
  for (let i = phases.length - 1; i >= 0; i--) {
    if (fileSet.has(phases[i].file)) {
      highestDone = i;
      break;
    }
  }

  return (
    <div className="space-y-1">
      {phases.map((phase, i) => {
        const done = fileSet.has(phase.file);
        const isNext = !done && i === highestDone + 1 && state === "running";

        let status: "done" | "active" | "pending" = "pending";
        if (done) status = "done";
        else if (isNext) status = "active";
        // Don't mark unfinished phases as done — they were skipped

        return (
          <div key={phase.file} className="flex items-center gap-3 text-sm">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                status === "done"
                  ? "bg-vc-green text-white"
                  : status === "active"
                    ? "bg-blue text-white animate-pulse"
                    : "bg-gray-200 text-muted"
              }`}
            >
              {status === "done" ? "✓" : phase.num}
            </div>
            <span
              className={`${
                status === "done"
                  ? "text-vc-green font-medium"
                  : status === "active"
                    ? "text-blue font-medium"
                    : "text-muted"
              }`}
            >
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
