"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// VerdictBadge removed — score + analyst take is the new design
import { BriefViewer } from "@/components/BriefViewer";
import { FileList } from "@/components/FileList";
import { RunControls } from "@/components/RunControls";
import { AskPanel } from "@/components/AskPanel";
import type { DealDetail, DealStatus } from "@/lib/types";

type Tab = "brief" | "files" | "run" | "ask";

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("run"); // default to run, switch to brief once deal loads
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Full fetch — includes htmlBrief, files, etc.
  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${name}`);
      if (res.ok) {
        const data = await res.json();
        setDeal(data);
        // Seed completed files from the files list
        const pipelineFiles = (data.files || [])
          .filter((f: { name: string }) => /^\d{2}-|^P\d-|^deck-extracted|^fund-memo|^quick-screen/.test(f.name))
          .map((f: { name: string }) => f.name);
        setCompletedFiles(pipelineFiles);
        // Set initial tab: brief if analysis exists, run if not
        if (data.htmlBrief) {
          setTab((prev) => prev === "run" ? "brief" : prev);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [name]);

  // Lightweight status poll — just status + completed files
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${name}/events`);
      if (res.ok) {
        const data = await res.json();
        setDeal((prev) => {
          if (!prev) return prev;
          const newStatus: DealStatus = {
            state: data.state,
            stage: data.stage,
            currentPhase: data.currentPhase,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            error: data.error,
          };
          // If pipeline just completed, do a full refresh to get brief + files
          if (
            prev.status.state === "running" &&
            (data.state === "complete" || data.state === "failed")
          ) {
            fetchDeal();
          }
          return { ...prev, status: newStatus };
        });
        if (data.completedFiles) {
          setCompletedFiles(data.completedFiles);
        }
      }
    } catch {
      // ignore
    }
  }, [name, fetchDeal]);

  // Initial full fetch
  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  // Poll status every 3s while running
  useEffect(() => {
    if (deal?.status.state !== "running") return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [deal?.status.state, pollStatus]);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted animate-pulse">
        Loading deal...
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted mb-4">Deal not found</p>
        <Link href="/" className="text-blue hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const hasBrief = !!deal.htmlBrief;
  const tabs: { key: Tab; label: string }[] = [
    ...(hasBrief ? [{ key: "brief" as Tab, label: "Brief" }] : []),
    { key: "run", label: "Analyze" },
    ...(hasBrief ? [{ key: "ask" as Tab, label: "Ask Claude" }] : []),
    { key: "files", label: "Files" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="text-sm text-muted hover:text-blue inline-block"
          >
            &larr; All Deals
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-muted hover:text-vc-red transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setDeleting(true);
                  const res = await fetch(`/api/deals/${deal.name}/delete`, { method: "POST" });
                  if (res.ok) router.push("/");
                  else setDeleting(false);
                }}
                disabled={deleting}
                className="text-xs text-vc-red font-medium"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-navy">
            {deal.displayName}
          </h1>
          {deal.totalScore !== null && (
            <span className={`text-2xl font-mono font-bold ${
              deal.totalScore >= 7 ? "text-vc-green" : deal.totalScore >= 5 ? "text-vc-amber" : "text-vc-red"
            }`}>
              {deal.totalScore.toFixed(1)}/10
            </span>
          )}
        </div>
        {/* Deal terms */}
        {deal.dealTerms && (
          <p className="mt-1 text-sm text-muted">{deal.dealTerms}</p>
        )}

        {/* Metadata badges */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {deal.meta.source && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-muted">
              Source: {deal.meta.source}
            </span>
          )}
          {deal.meta.nextReview && (
            <span className="px-2 py-0.5 bg-vc-amber/10 text-vc-amber rounded">
              Review: {deal.meta.nextReview}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-blue text-blue"
                  : "border-transparent text-muted hover:text-body"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "brief" && (
        <div>
          {deal.htmlBrief ? (
            <BriefViewer html={deal.htmlBrief} dealName={deal.name} />
          ) : (
            <div className="text-center py-16 text-muted">
              <p className="text-lg mb-2">No brief generated yet</p>
              <p className="text-sm">
                Run a screening pipeline to generate the executive brief.
              </p>
              <button
                onClick={() => setTab("run")}
                className="mt-4 px-4 py-2 bg-navy text-white rounded-lg text-sm hover:bg-blue transition-colors"
              >
                Go to Run tab
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "files" && (
        <FileList files={deal.files} dealName={deal.name} />
      )}

      {tab === "run" && (
        <div className="space-y-8">
        <RunControls
          dealName={deal.name}
          status={deal.status}
          stage={deal.stage}
          hasScreening={deal.stage === "screening" || deal.stage === "deep"}
          completedFiles={completedFiles}
          onRunStarted={fetchDeal}
          onUploadComplete={fetchDeal}
        />
        </div>
      )}

      {tab === "ask" && (
        <div>
          <p className="text-sm text-muted mb-4">
            Ask anything about this deal. Claude has the full analysis as context and will answer based on what was found.
          </p>
          <AskPanel dealName={deal.name} />
        </div>
      )}
    </div>
  );
}
