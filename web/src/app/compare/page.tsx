"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { DealSummary } from "@/lib/types";

export default function ComparePage() {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then(setDeals)
      .catch(() => {});
  }, []);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 4
          ? [...prev, name]
          : prev
    );
  };

  const compared = deals.filter((d) => selected.includes(d.name));

  const scoreColor = (score: number) =>
    score >= 7 ? "#27AE60" : score >= 5 ? "#F39C12" : "#E74C3C";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Compare Deals</h1>
        <Link
          href="/"
          className="text-sm text-muted hover:text-blue"
        >
          &larr; Dashboard
        </Link>
      </div>

      {/* Deal selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {deals.map((d) => (
          <button
            key={d.name}
            onClick={() => toggle(d.name)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              selected.includes(d.name)
                ? "bg-navy text-white border-navy"
                : "bg-white text-body border-border hover:border-blue/40"
            }`}
          >
            {d.displayName}
          </button>
        ))}
      </div>

      {selected.length < 2 && (
        <p className="text-muted text-sm">Select 2-4 deals to compare.</p>
      )}

      {/* Comparison table */}
      {compared.length >= 2 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-navy text-white">
                <th className="p-3 text-left font-semibold w-40">Dimension</th>
                {compared.map((d) => (
                  <th key={d.name} className="p-3 text-center font-semibold">
                    <Link
                      href={`/deals/${d.name}`}
                      className="hover:underline"
                    >
                      {d.displayName}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Verdict */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-navy">Verdict</td>
                {compared.map((d) => (
                  <td key={d.name} className="p-3 text-center">
                    {d.verdict ? (
                      <VerdictBadge
                        verdict={d.verdict.verdict}
                        color={d.verdict.color}
                        size="sm"
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Total Score */}
              <tr className="border-b border-border bg-gray-50">
                <td className="p-3 font-medium text-navy">Total Score</td>
                {compared.map((d) => (
                  <td
                    key={d.name}
                    className="p-3 text-center font-bold text-lg"
                    style={{
                      color: d.totalScore ? scoreColor(d.totalScore) : "#666",
                    }}
                  >
                    {d.totalScore ? `${d.totalScore}/10` : "—"}
                  </td>
                ))}
              </tr>

              {/* Deal Terms */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-navy">Terms</td>
                {compared.map((d) => (
                  <td
                    key={d.name}
                    className="p-3 text-center text-xs text-muted"
                  >
                    {d.dealTerms || "—"}
                  </td>
                ))}
              </tr>

              {/* Stage */}
              <tr className="border-b border-border bg-gray-50">
                <td className="p-3 font-medium text-navy">Stage</td>
                {compared.map((d) => (
                  <td key={d.name} className="p-3 text-center text-xs">
                    {d.stage === "screening"
                      ? "Screened"
                      : d.stage === "deep"
                        ? "Deep Diligence"
                        : "Pending"}
                  </td>
                ))}
              </tr>

              {/* Top Risk */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-navy">Top Risk</td>
                {compared.map((d) => (
                  <td
                    key={d.name}
                    className="p-3 text-center text-xs text-vc-red"
                  >
                    {d.topRisk || "—"}
                  </td>
                ))}
              </tr>

              {/* Claims */}
              <tr className="border-b border-border bg-gray-50">
                <td className="p-3 font-medium text-navy">Claims</td>
                {compared.map((d) => (
                  <td key={d.name} className="p-3 text-center text-xs">
                    <span className="mr-2">
                      ✅ {d.claimCounts.verified}
                    </span>
                    <span className="mr-2">
                      ⚠️ {d.claimCounts.unverified}
                    </span>
                    <span>🚩 {d.claimCounts.questionable}</span>
                  </td>
                ))}
              </tr>

              {/* Source */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-navy">Source</td>
                {compared.map((d) => (
                  <td
                    key={d.name}
                    className="p-3 text-center text-xs text-muted"
                  >
                    {d.meta.source || "—"}
                  </td>
                ))}
              </tr>

              {/* Thesis */}
              <tr>
                <td className="p-3 font-medium text-navy align-top">Thesis</td>
                {compared.map((d) => (
                  <td
                    key={d.name}
                    className="p-3 text-xs text-muted leading-relaxed"
                  >
                    {d.thesis || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
