"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DealMeta } from "@/lib/types";

const PASS_REASONS = [
  "", "valuation", "team", "market", "terms",
  "structural", "timing", "competitive", "financial", "other",
];

const OUTCOME_STATUSES = [
  "", "raised", "operating", "failed", "acquired", "pivoted", "unknown",
];

export function DealMetaEditor({
  dealName,
  initialMeta,
}: {
  dealName: string;
  initialMeta: DealMeta;
}) {
  const [meta, setMeta] = useState<DealMeta>(initialMeta);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMeta(initialMeta);
  }, [initialMeta]);

  const pendingRef = useRef<Partial<DealMeta>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(async () => {
    const updates = pendingRef.current;
    if (Object.keys(updates).length === 0) return;
    pendingRef.current = {};
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/deals/${dealName}/meta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }, [dealName]);

  function save(updates: Partial<DealMeta>) {
    setMeta((prev) => ({ ...prev, ...updates }));
    pendingRef.current = { ...pendingRef.current, ...updates };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushSave, 600);
  }

  const field = (
    label: string,
    key: keyof DealMeta,
    type: "text" | "date" | "select" | "textarea" = "text",
    options?: string[]
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted uppercase tracking-wide">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={meta[key]}
          onChange={(e) => save({ [key]: e.target.value })}
          rows={2}
          className="px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue/40 resize-none"
        />
      ) : type === "select" ? (
        <select
          value={meta[key]}
          onChange={(e) => save({ [key]: e.target.value })}
          className="px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue/40 bg-white"
        >
          {options?.map((o) => (
            <option key={o} value={o}>
              {o || "— Select —"}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={meta[key]}
          onChange={(e) => save({ [key]: e.target.value })}
          className="px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue/40"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
          Deal Info
        </h3>
        {saving && (
          <span className="text-xs text-muted animate-pulse">Saving...</span>
        )}
        {saved && <span className="text-xs text-vc-green">Saved</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("Referral Source", "source")}
        {field("Date Received", "dateReceived", "date")}
        {field("Decision By", "decisionBy")}
        {field("Decision Date", "decisionDate", "date")}
        {field("Pass Reason", "passReason", "select", PASS_REASONS)}
        {field("Next Review Date", "nextReview", "date")}
      </div>

      {/* Outcome Tracking */}
      <div className="flex items-center justify-between mt-4">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
          Outcome Tracking
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("Status", "outcomeStatus", "select", OUTCOME_STATUSES)}
        {field("Date Recorded", "outcomeDate", "date")}
        {field("Valuation (if raised)", "outcomeValuation")}
      </div>
      {field("What happened?", "outcomeNotes", "textarea")}
    </div>
  );
}
