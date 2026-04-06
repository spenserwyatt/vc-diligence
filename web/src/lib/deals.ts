import fs from "fs";
import path from "path";
import { DEALS_DIR, OUTPUT_DIR } from "./paths";
import { readStatus } from "./status";
import type { DealSummary, DealDetail, DealFile, DealMeta } from "./types";

export type { DealSummary, DealDetail, DealFile, DealMeta };

const DEFAULT_META: DealMeta = {
  source: "",
  dateReceived: "",
  decisionDate: "",
  decisionBy: "",
  passReason: "",
  nextReview: "",
  notes: "",
  outcomeStatus: "",
  outcomeDate: "",
  outcomeValuation: "",
  outcomeNotes: "",
};

export function readMeta(dealName: string): DealMeta {
  const metaPath = path.join(DEALS_DIR, dealName, "meta.json");
  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    return { ...DEFAULT_META, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_META };
  }
}

export function writeMeta(dealName: string, updates: Partial<DealMeta>): void {
  const metaPath = path.join(DEALS_DIR, dealName, "meta.json");
  const current = readMeta(dealName);
  fs.writeFileSync(metaPath, JSON.stringify({ ...current, ...updates }, null, 2));
}

// --- Markdown parsing (ported from generate-brief.js) ---

function extractSection(md: string, sectionPattern: string): string {
  // Try ## headings first (standard numbered format: ## 1. Executive Summary)
  let regex = new RegExp(`^##\\s+${sectionPattern}[\\s\\S]*?$`, "m");
  let match = md.match(regex);
  let stopPattern = /^## /m; // Stop at next ## heading (allows ### subheadings within)

  if (!match) {
    // Fallback: ### headings (some fund memos use ### Section Name)
    regex = new RegExp(`^###\\s+${sectionPattern}[\\s\\S]*?$`, "m");
    match = md.match(regex);
    stopPattern = /^#{2,3}\s/m; // For ### sections, stop at ## or ###
  }
  if (!match) return "";
  const startIdx = match.index! + match[0].length;
  const nextSection = md.slice(startIdx).search(stopPattern);
  const endIdx = nextSection === -1 ? md.length : startIdx + nextSection;
  return md.slice(startIdx, endIdx).trim();
}

export function extractVerdict(
  md: string
): { verdict: string; color: string } | null {
  // Check Recommendation section (numbered or unnumbered)
  const recSection =
    extractSection(md, "\\d+\\.\\s*Recommendation") ||
    extractSection(md, "Recommendation") ||
    extractSection(md, "Verdict");
  if (recSection) {
    const firstLine = recSection.split("\n")[0];
    if (
      /###?\s*PASS\b/i.test(recSection) ||
      /\*\*PASS\.?\*\*/i.test(recSection) ||
      /\bPASS\b/.test(firstLine)
    ) {
      return { verdict: "PASS", color: "red" };
    }
    if (
      /###?\s*PROCEED\b/i.test(recSection) ||
      /\*\*PROCEED\.?\*\*/i.test(recSection) ||
      /\bPROCEED\b/.test(firstLine)
    ) {
      return { verdict: "PROCEED", color: "green" };
    }
    if (/NEED MORE INFO/i.test(recSection) || /NEED MORE INFO/i.test(firstLine)) {
      return { verdict: "NEED MORE INFO", color: "amber" };
    }
    if (/CONDITIONAL/i.test(firstLine)) {
      return { verdict: "CONDITIONAL PROCEED", color: "amber" };
    }
    return { verdict: "CONDITIONAL PROCEED", color: "amber" };
  }

  // Fallback: check "Analyst Recommendation:" header line
  const headerMatch = md.match(/\*\*Analyst Recommendation:\*\*\s*(\w+)/);
  if (headerMatch) {
    const v = headerMatch[1].toUpperCase();
    if (v === "PASS") return { verdict: "PASS", color: "red" };
    if (v === "PROCEED") return { verdict: "PROCEED", color: "green" };
    return { verdict: "CONDITIONAL PROCEED", color: "amber" };
  }

  // Fallback: inline verdict patterns (fund memos)
  const inlineMatch = md.match(/\*\*(?:Final )?Score:\s*[\d.]+\s*\/\s*10\s*[-—–]+\s*(\w[\w\s]*?)\*\*/);
  if (inlineMatch) {
    const v = inlineMatch[1].trim().toUpperCase();
    if (v === "PASS") return { verdict: "PASS", color: "red" };
    if (v === "PROCEED") return { verdict: "PROCEED", color: "green" };
    return { verdict: "CONDITIONAL PROCEED", color: "amber" };
  }

  return null;
}

export function extractTotalScore(md: string): number | null {
  // Standard: ## N. Deal Score section with TOTAL row
  const scoreSection =
    extractSection(md, "\\d+\\.\\s*Deal Score") ||
    extractSection(md, "5P Scoring");
  if (scoreSection) {
    const totalMatch = scoreSection.match(
      /\*\*(?:TOTAL|Total)\*\*\s*\|[^|]*\|[^|]*\|\s*\*\*(\d+\.?\d*)\s*\/?\s*(?:10)?\*\*/
    );
    if (totalMatch) return parseFloat(totalMatch[1]);

    const fallback = scoreSection.match(/(\d+\.?\d*)\s*\/\s*10/);
    if (fallback) return parseFloat(fallback[1]);
  }

  // Fallback: inline **Final Score: X / 10** or **Score: X / 10** anywhere
  const inlineScore = md.match(/\*\*(?:Final )?Score:\s*(\d+\.?\d*)\s*\/\s*10\*\*/);
  if (inlineScore) return parseFloat(inlineScore[1]);

  return null;
}

export function extractClaimCounts(md: string): {
  verified: number;
  unverified: number;
  questionable: number;
} {
  const claimSection =
    extractSection(md, "\\d+\\.\\s*Claim Verification Summary") ||
    extractSection(md, "Claim Verification Summary");
  if (!claimSection)
    return { verified: 0, unverified: 0, questionable: 0 };

  // Count both emoji and text-based statuses
  const verified =
    (claimSection.match(/✅/g) || []).length +
    (claimSection.match(/\|\s*Verified\s*\|/gi) || []).length;
  const unverified =
    (claimSection.match(/⚠️/g) || []).length +
    (claimSection.match(/\|\s*Unverified\s*\|/gi) || []).length;
  const questionable =
    (claimSection.match(/🚩/g) || []).length +
    (claimSection.match(/\|\s*Questionable\s*\|/gi) || []).length;

  return { verified, unverified, questionable };
}

export function extractWeakestLink(md: string): string | null {
  // Find the adversarial review appendix
  const advMatch = md.match(/^#{1,2}\s+(?:(?:APPENDIX|Appendix):\s+)?(?:ADVERSARIAL REVIEW|Adversarial Review)/m);
  if (!advMatch) return null;
  const adv = md.slice(advMatch.index! + advMatch[0].length);
  // Find the Weakest Link subsection
  const wlMatch = adv.match(/^#{2,3}\s+(?:\d+\.\s+)?Weakest Link[^\n]*\n+([\s\S]*?)(?=\n#{2,3}\s+(?:\d+\.)?|$)/mi);
  if (!wlMatch) return null;
  const paragraphs = wlMatch[1].trim().split(/\n\n+/).filter(p => p.trim() && !p.trim().startsWith("|"));
  if (paragraphs.length === 0) return null;
  let text = paragraphs[0].replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1").trim();
  if (text.length > 200) text = text.slice(0, 200).replace(/\s+\S*$/, "") + "...";
  return text;
}

function extractDealTerms(md: string): string | null {
  const match = md.match(/\*\*Deal:\*\*\s*(.+)/);
  return match ? match[1].trim() : null;
}

function extractTopRisk(md: string): string | null {
  const riskSection = extractSection(md, "\\d+\\.\\s*Risk Matrix");
  if (!riskSection) return null;
  // Find the first data row (highest risk)
  for (const line of riskSection.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    // Skip header/separator rows
    if (/^-+$/.test(cells[0]) || /risk/i.test(cells[0])) continue;
    // First cell might be a number (Drycor) or the risk name (Affinity)
    const riskName = /^\d+$/.test(cells[0]) ? cells[1] : cells[0];
    if (riskName && riskName.length > 5) return riskName;
  }
  return null;
}

function extractThesis(md: string): string | null {
  // Get the first substantive paragraph — what the company/fund does
  let execSection = extractSection(md, "\\d+\\.\\s*Executive Summary");
  if (!execSection) execSection = extractSection(md, "Executive Summary");
  if (!execSection) return null;

  const paragraphs = execSection
    .split(/\n\n+/)
    .filter((p) => {
      const t = p.trim();
      return t && !t.startsWith("|") && !t.startsWith("-") && !t.startsWith("<!--") && !t.startsWith("#") && !t.startsWith("**Date") && !t.startsWith("**Deal") && !t.startsWith("**Stage") && t.length > 30;
    });
  if (paragraphs.length === 0) return null;

  // First paragraph is usually "what is this company/fund"
  let text = paragraphs[0].replace(/\*\*/g, "").trim();

  // Take first 1-2 sentences — enough to describe what they do
  const sentences = text.match(/[^.!]+[.!]+/g);
  if (sentences && sentences.length > 2) {
    text = sentences.slice(0, 2).join("").trim();
  }
  if (text.length > 200) text = text.slice(0, 200).replace(/\s+\S*$/, "") + "...";
  return text;
}

function extractTitle(md: string): string {
  const stripPatterns = (s: string) =>
    s
      .replace(/INVESTMENT MEMO/i, "")
      .replace(/SCREENING MEMO/i, "")
      .replace(/DILIGENCE REPORT/i, "")
      .replace(/FUND EVALUATION/i, "")
      .replace(/Fund Diligence Memo:\s*/i, "")
      .replace(/[—–-]+\s*Pre-Data Room.*/i, "")
      .replace(/[—–-]+\s*Post-Data Room.*/i, "")
      .replace(/[—–-]+.*/, "")
      .replace(/\([^)]*\)$/g, "") // trailing parenthetical
      .replace(/\(d\/b\/a\s+[^)]+\)/i, "")
      .replace(/,\s*(Inc\.|LLC|Corp\.|Ltd\.)?\s*$/i, "")
      .trim();

  const isJunk = (s: string) =>
    !s ||
    s.length < 3 ||
    /^appendix/i.test(s) ||
    /^adversarial/i.test(s) ||
    /^stage \d/i.test(s) ||
    /^what we know/i.test(s) ||
    /^screening/i.test(s);

  // Try all H1 headings
  const h1Regex = /^# (.+)/gm;
  let match;
  while ((match = h1Regex.exec(md)) !== null) {
    const cleaned = stripPatterns(match[1]);
    if (!isJunk(cleaned)) return cleaned;
  }

  // Fallback: first non-numbered ## heading that looks like a name
  const h2Regex = /^## ([^0-9\n].+)/gm;
  while ((match = h2Regex.exec(md)) !== null) {
    const cleaned = stripPatterns(match[1]);
    if (!isJunk(cleaned) && cleaned.length < 60) return cleaned;
  }

  // Fallback: extract from **Deal:** or **Fund:** line
  const dealMatch = md.match(/\*\*(?:Deal|Fund):\*\*[^,]*[,—–-]\s*([^,\n]+)/);
  if (dealMatch) return stripPatterns(dealMatch[1]);

  return "";
}

// --- File categorization ---

function categorizeFile(filename: string): DealFile["category"] {
  const lower = filename.toLowerCase();

  // Pipeline outputs: 01-extraction.md through 09-full-report.md, or P1-P5 fund phases
  if (/^\d{2}-/.test(filename) && lower.endsWith(".md")) return "pipeline";
  if (/^p\d-/.test(lower) && lower.endsWith(".md")) return "pipeline";
  if (lower === "fund-memo.md" || lower === "deck-extracted.md") return "pipeline";

  // Deliverables
  if (
    lower.endsWith(".html") ||
    (lower.endsWith(".docx") && !lower.startsWith("~$"))
  )
    return "deliverable";

  // Source documents (PDFs, original uploads)
  if (
    lower.endsWith(".pdf") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".pptx") ||
    lower.endsWith(".csv")
  )
    return "source";

  // Everything else goes to dataroom
  return "dataroom";
}

// --- Deal listing ---

function inferStage(files: string[]): "none" | "screening" | "deep" {
  const has09 = files.some((f) => f.startsWith("09-"));
  const has08 = files.some((f) => f.startsWith("08-"));
  if (has09 || has08) return "deep";

  const has07 = files.some((f) => f.startsWith("07-"));
  if (has07) return "screening";

  // Fund pipeline completion
  const hasFundMemo = files.some((f) => f === "fund-memo.md");
  if (hasFundMemo) return "screening";

  return "none";
}

function getMemoContent(dealDir: string): string | null {
  // Try in priority order: full report, deal memo, fund memo
  for (const name of ["09-full-report.md", "07-memo.md", "fund-memo.md"]) {
    const p = path.join(dealDir, name);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  return null;
}

export function listDeals(): DealSummary[] {
  if (!fs.existsSync(DEALS_DIR)) return [];

  const entries = fs.readdirSync(DEALS_DIR, { withFileTypes: true });
  const deals: DealSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "EXAMPLE") continue;

    const dealDir = path.join(DEALS_DIR, entry.name);
    const files = fs.readdirSync(dealDir);
    const memo = getMemoContent(dealDir);

    // Check for HTML brief in output/
    const briefName = `${entry.name}-brief.html`;
    const hasHtmlBrief = fs.existsSync(path.join(OUTPUT_DIR, briefName));

    // Get last modified time
    const stats = files
      .map((f) => {
        try {
          return fs.statSync(path.join(dealDir, f)).mtimeMs;
        } catch {
          return 0;
        }
      })
      .filter((t) => t > 0);
    const lastModified = stats.length
      ? new Date(Math.max(...stats)).toISOString()
      : new Date().toISOString();

    const title = memo ? extractTitle(memo) : "";
    const displayName =
      title || entry.name.charAt(0).toUpperCase() + entry.name.slice(1);

    deals.push({
      name: entry.name,
      displayName,
      verdict: memo ? extractVerdict(memo) : null,
      totalScore: memo ? extractTotalScore(memo) : null,
      claimCounts: memo
        ? extractClaimCounts(memo)
        : { verified: 0, unverified: 0, questionable: 0 },
      dealTerms: memo ? extractDealTerms(memo) : null,
      topRisk: memo ? extractTopRisk(memo) : null,
      thesis: memo ? extractThesis(memo) : null,
      weakestLink: memo ? extractWeakestLink(memo) : null,
      meta: readMeta(entry.name),
      status: readStatus(entry.name),
      stage: inferStage(files),
      lastModified,
      hasHtmlBrief,
    });
  }

  // Sort by most recent
  deals.sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return deals;
}

export function getDealDetail(dealName: string): DealDetail | null {
  const dealDir = path.join(DEALS_DIR, dealName);
  if (!fs.existsSync(dealDir)) return null;

  const fileNames = fs.readdirSync(dealDir).filter(
    (f) => !f.startsWith(".") && !f.startsWith("~$") && f !== "status.json" && f !== "conversations.json" && f !== "meta.json"
  );

  const files: DealFile[] = fileNames.map((name) => {
    const filePath = path.join(dealDir, name);
    const stat = fs.statSync(filePath);
    return {
      name,
      category: categorizeFile(name),
      size: stat.size,
      modified: stat.mtime.toISOString(),
    };
  });

  // Read HTML brief
  let htmlBrief: string | null = null;
  const briefPath = path.join(OUTPUT_DIR, `${dealName}-brief.html`);
  if (fs.existsSync(briefPath)) {
    htmlBrief = fs.readFileSync(briefPath, "utf-8");
  }

  const memo = getMemoContent(dealDir);
  const title = memo ? extractTitle(memo) : "";
  const displayName =
    title.replace(/\s*INVESTMENT MEMO\s*/i, "").trim() ||
    dealName.charAt(0).toUpperCase() + dealName.slice(1);

  return {
    name: dealName,
    displayName,
    verdict: memo ? extractVerdict(memo) : null,
    totalScore: memo ? extractTotalScore(memo) : null,
    claimCounts: memo
      ? extractClaimCounts(memo)
      : { verified: 0, unverified: 0, questionable: 0 },
    dealTerms: memo ? extractDealTerms(memo) : null,
    topRisk: memo ? extractTopRisk(memo) : null,
    thesis: memo ? extractThesis(memo) : null,
    weakestLink: memo ? extractWeakestLink(memo) : null,
    meta: readMeta(dealName),
    status: readStatus(dealName),
    stage: inferStage(fileNames),
    lastModified:
      files.length > 0
        ? new Date(
            Math.max(...files.map((f) => new Date(f.modified).getTime()))
          ).toISOString()
        : new Date().toISOString(),
    hasHtmlBrief: !!htmlBrief,
    files,
    htmlBrief,
  };
}
