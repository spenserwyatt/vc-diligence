#!/usr/bin/env node
/**
 * generate-brief.js — Convert a markdown memo to a self-contained HTML executive brief
 *
 * Usage: node scripts/generate-brief.js <input.md> <output.html> [screening|full]
 * Example: node scripts/generate-brief.js deals/drycor/07-memo.md output/drycor-brief.html screening
 */

const fs = require("fs");
const path = require("path");

const [inputPath, outputPath, stageArg] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/generate-brief.js <input.md> <output.html> [screening|full]"
  );
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

const stage = stageArg === "full" ? "full" : "screening";
const stageLabel = stage === "full" ? "FULL DILIGENCE" : "SCREENING";
const markdown = fs.readFileSync(inputPath, "utf-8");

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const COLORS = {
  navy: "#1B2A4A",
  blue: "#2C5F8A",
  lightBlue: "#3A7CA5",
  green: "#27AE60",
  amber: "#F39C12",
  red: "#E74C3C",
  body: "#333333",
  muted: "#666666",
  lightGray: "#F8F9FA",
  border: "#BDC3C7",
  white: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Parsing helpers — kept / adapted from original
// ---------------------------------------------------------------------------

function extractSection(md, sectionPattern) {
  // Try ## headings first (standard numbered format: ## 1. Executive Summary)
  let regex = new RegExp(
    `^##\\s+${sectionPattern}[\\s\\S]*?$`,
    "m"
  );
  let match = md.match(regex);

  if (match) {
    const startIdx = match.index + match[0].length;
    const nextSection = md.slice(startIdx).search(/^## /m);
    const endIdx = nextSection === -1 ? md.length : startIdx + nextSection;
    return md.slice(startIdx, endIdx).trim();
  }

  // Fallback: try ### headings (some memos use ### subsections under a single ##)
  regex = new RegExp(
    `^###\\s+${sectionPattern}[\\s\\S]*?$`,
    "m"
  );
  match = md.match(regex);

  if (match) {
    const startIdx = match.index + match[0].length;
    const nextSection = md.slice(startIdx).search(/^###? /m);
    const endIdx = nextSection === -1 ? md.length : startIdx + nextSection;
    return md.slice(startIdx, endIdx).trim();
  }

  // Fallback: strip the numbered prefix requirement and try plain name match
  // e.g., "\\d+\\.\\s*Executive Summary" -> "Executive Summary"
  const plainPattern = sectionPattern.replace(/^\\d\+\\\.\s*\\s\*/, "").replace(/^\(\?:\\d\+\\\.\s*\\s\*\)\?/, "");
  if (plainPattern !== sectionPattern && plainPattern.length > 3) {
    for (const prefix of ["## ", "### "]) {
      regex = new RegExp(`^${prefix.replace(/ $/, "\\s+")}${plainPattern}[\\s\\S]*?$`, "m");
      match = md.match(regex);
      if (match) {
        const startIdx = match.index + match[0].length;
        const headingLevel = prefix.trim();
        const nextSection = md.slice(startIdx).search(new RegExp(`^${headingLevel}\\s`, "m"));
        const endIdx = nextSection === -1 ? md.length : startIdx + nextSection;
        return md.slice(startIdx, endIdx).trim();
      }
    }
  }

  return "";
}

function extractH1Title(md) {
  // Try all H1 headings, not just the first — some memos have multiple
  const h1Regex = /^# (.+)/gm;
  let match;
  while ((match = h1Regex.exec(md)) !== null) {
    const raw = match[1].trim();
    const cleaned = raw
      .replace(/INVESTMENT MEMO/i, "")
      .replace(/SCREENING MEMO/i, "")
      .replace(/DILIGENCE REPORT/i, "")
      .replace(/FUND EVALUATION/i, "")
      .replace(/APPENDIX[^]*/i, "")
      .replace(/ADVERSARIAL REVIEW.*/i, "")
      .replace(/[—–-]+.*/, "")
      .replace(/\([^)]*\)$/, "")  // strip trailing parenthetical like ($250MM...)
      .trim();
    if (cleaned && cleaned.length > 2 && !/^appendix/i.test(cleaned) && !/^adversarial/i.test(cleaned)) return cleaned;
  }

  // Fallback: first ## heading that isn't a numbered section
  const h2 = md.match(/^## ([^0-9\n].+)/m);
  if (h2) {
    const h2Clean = h2[1]
      .replace(/\(d\/b\/a\s+[^)]+\)/i, "")
      .replace(/,\s*(Inc\.|LLC|Corp\.|Ltd\.)?\s*$/i, "")
      .trim();
    if (h2Clean && h2Clean.length > 2) return h2Clean;
  }

  // Fallback: extract from **Deal:**  or **Fund:** line
  const dealMatch = md.match(/\*\*(?:Deal|Fund):\*\*[^,]*[,—–-]\s*([^,\n]+)/);
  if (dealMatch) return dealMatch[1].trim();

  return "Investment Memo";
}

function extractDate(md) {
  const match = md.match(/\*\*Date:\*\*\s*(.+)/);
  return match ? match[1].trim() : new Date().toLocaleDateString();
}

function extractDeal(md) {
  const match = md.match(/\*\*Deal:\*\*\s*(.+)/);
  return match ? match[1].trim() : "";
}

function extractVerdict(md) {
  const recSection = extractSection(md, "\\d+\\.\\s*Recommendation");
  if (!recSection) return { verdict: "NEED MORE INFO", color: "amber" };

  const firstLine = recSection.split("\n")[0];
  const combined = firstLine + " " + recSection.slice(0, 500);

  if (/\bPASS\b/.test(firstLine) || /###\s*PASS\b/i.test(recSection)) {
    return { verdict: "PASS", color: "red" };
  }
  // Fund verdicts
  if (/CONDITIONAL COMMIT/i.test(combined)) {
    return { verdict: "CONDITIONAL COMMIT", color: "amber" };
  }
  if (/\bCOMMIT\b/.test(firstLine) || /###\s*COMMIT\b/i.test(recSection)) {
    return { verdict: "COMMIT", color: "green" };
  }
  // Deal verdicts
  if (/CONDITIONAL PROCEED/i.test(combined)) {
    return { verdict: "CONDITIONAL PROCEED", color: "amber" };
  }
  if (/\bPROCEED\b/.test(firstLine) || /###\s*PROCEED\b/i.test(recSection)) {
    return { verdict: "PROCEED", color: "green" };
  }
  return { verdict: "NEED MORE INFO", color: "amber" };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mdBoldToHtml(text) {
  return escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );
}

// ---------------------------------------------------------------------------
// Existing extractors — kept / adapted
// ---------------------------------------------------------------------------

function extractBottomLine(md) {
  const execSection = extractSection(md, "\\d+\\.\\s*Executive Summary");
  if (!execSection) return "";
  const paragraphs = execSection
    .split(/\n\n+/)
    .filter((p) => p.trim() && !p.trim().startsWith("|") && !p.trim().startsWith("---") && !p.trim().startsWith("<!--"));
  if (paragraphs.length >= 2) {
    return paragraphs[1].trim();
  }
  return paragraphs[0] ? paragraphs[0].trim() : "";
}

function extractFullExecSummary(md) {
  const execSection = extractSection(md, "\\d+\\.\\s*Executive Summary");
  if (!execSection) return [];
  return extractProse(execSection);
}

// Pulls flowing prose paragraphs from a section — skips tables, comments, lists, headers
function extractProse(section, maxParagraphs) {
  maxParagraphs = maxParagraphs || 10;
  return section
    .split(/\n\n+/)
    .filter((p) => {
      const t = p.trim();
      return t &&
        !t.startsWith("|") &&
        !t.startsWith("---") &&
        !t.startsWith("<!--") &&
        !t.startsWith("###") &&
        !t.startsWith("- **") &&
        !t.startsWith("* **") &&
        t.length > 40;
    })
    .map((p) => p.trim())
    .slice(0, maxParagraphs);
}

function extractSectionProse(md, sectionName, max) {
  const section = extractSection(md, sectionName);
  if (!section) return [];
  return extractProse(section, max || 2);
}

function extractBullCase(md) {
  return extractFullCaseSection(md, "\\d+\\.\\s*The Bull Case");
}

function extractBearCase(md) {
  return extractFullCaseSection(md, "\\d+\\.\\s*Reasons NOT to Invest");
}

// Extracts full paragraphs with headline + explanation from bull/bear sections
function extractFullCaseSection(md, sectionPattern) {
  const section = extractSection(md, sectionPattern);
  if (!section) return [];

  const items = [];
  const paragraphs = section.split(/\n\n+/).filter((p) => {
    const t = p.trim();
    return t && !t.startsWith("<!--") && !t.startsWith("---") && !t.startsWith("|") && t.length > 30;
  });

  for (const para of paragraphs) {
    // Try to split into bold headline + explanation
    const boldMatch = para.match(/^\*\*(.+?)\*\*\s*([\s\S]*)/);
    if (boldMatch) {
      const headline = boldMatch[1].replace(/^\d+\.\s*/, "").replace(/\.$/, "").trim();
      const explanation = boldMatch[2].trim();
      if (headline.length > 10 && !/^confidence/i.test(headline)) {
        items.push({ headline, explanation });
      }
    }
  }
  return items.slice(0, 5);
}

// Legacy: just headlines (used by fund memo path)
function extractBoldItems(section) {
  const items = [];
  const para = /\*\*([^*]{10,}?)\*\*/g;
  let match;
  while ((match = para.exec(section)) !== null) {
    let text = match[1].trim().replace(/\.$/, "");
    if (/^confidence/i.test(text) || text.length < 15) continue;
    items.push(text);
  }
  return items.slice(0, 5);
}

function extractScores(md) {
  const scoreSection = extractSection(md, "\\d+\\.\\s*Deal Score");
  if (!scoreSection) return [];

  const scores = [];
  const lines = scoreSection.split("\n");
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;

    const name = cells[0].replace(/\*\*/g, "").trim();
    if (/^total$/i.test(name) || /^dimension$/i.test(name) || /^-+$/.test(name)) continue;

    const weightMatch = cells[1].match(/([\d.]+)%/);
    if (!weightMatch) continue;

    const scoreVal = parseFloat(cells[2]);
    if (isNaN(scoreVal)) continue;

    let rationale = "";
    if (cells.length >= 5 && cells[4]) {
      const col5 = cells[4].replace(/\*\*/g, "").trim();
      if (col5 && !/^[\d.\-]+$/.test(col5) && col5 !== "--") {
        rationale = col5;
      }
    }

    // Truncate rationale for display
    if (rationale.length > 150) rationale = rationale.slice(0, 147) + "...";

    scores.push({
      name,
      weight: parseFloat(weightMatch[1]),
      score: scoreVal,
      rationale,
    });
  }

  // If no rationale was found in the table, try to infer from Score interpretation
  if (scores.length > 0 && scores.every((s) => !s.rationale)) {
    const interpretation = scoreSection.match(
      /\*\*Score interpretation:\*\*\s*([^\n]+)/i
    );
    if (interpretation) {
      const interp = interpretation[1];
      for (const s of scores) {
        const nameLower = s.name.toLowerCase();
        const dimPatterns = {
          team: /team['s]?\s+[^,.]+/i,
          market: /market\s+[^,.]+/i,
          "product/traction": /product|traction[^,.]+/i,
          "financial viability": /financial\s+[^,.]+/i,
          "risk-adjusted": /risk[^,.]+/i,
          "impact integrity": /impact\s+[^,.]+/i,
        };
        for (const [key, pat] of Object.entries(dimPatterns)) {
          if (nameLower.includes(key.split("/")[0])) {
            const m = interp.match(pat);
            if (m) s.rationale = m[0].trim();
          }
        }
      }
    }

    // Fallback: section verdicts
    const sectionVerdicts = {
      team: /\*\*Verdict:\s*([^*]+)\*\*/,
      market: /\*\*(?:Our view|Moat|Market):\s*([^*]+)\*\*/i,
    };
    for (const s of scores) {
      if (s.rationale) continue;
      const nameLower = s.name.toLowerCase();
      for (const [key, pat] of Object.entries(sectionVerdicts)) {
        if (nameLower.includes(key)) {
          const sectionName = key.charAt(0).toUpperCase() + key.slice(1);
          const section = extractSection(md, `\\d+\\.\\s*${sectionName}`);
          if (section) {
            const m = section.match(pat);
            if (m) s.rationale = m[1].trim();
          }
        }
      }
    }
  }

  return scores;
}

function extractTotalScore(md) {
  const scoreSection = extractSection(md, "\\d+\\.\\s*Deal Score");
  if (!scoreSection) return null;
  const totalMatch = scoreSection.match(
    /\*\*(?:TOTAL|Total)\*\*\s*\|[^|]*\|[^|]*\|\s*\*\*(\d+\.?\d*)\s*\/\s*10\*\*/
  );
  if (totalMatch) return parseFloat(totalMatch[1]);
  const altMatch = scoreSection.match(
    /\*\*(\d+\.?\d*)\s*\/\s*10\*\*/
  );
  if (altMatch) return parseFloat(altMatch[1]);
  // Fallback: "Score: X / 10" or "X/10"
  const fallback = scoreSection.match(/(\d+\.?\d*)\s*\/\s*10/);
  return fallback ? parseFloat(fallback[1]) : null;
}

function extractClaimDetails(md) {
  const claimSection = extractSection(md, "\\d+\\.\\s*Claim Verification Summary");
  if (!claimSection) return { questionable: [], unverified: [], verifiedCount: 0, totalQuestionable: 0, totalUnverified: 0 };

  const questionable = [];
  const unverified = [];
  let verifiedCount = 0;

  const lines = claimSection.split("\n");
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const idMatch = line.match(/\|\s*(C\d+)\s*\|/);
    if (!idMatch) continue;

    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    const claimText = cells.length >= 2 ? cells[1].replace(/\*\*/g, "") : "";

    let status = "";
    for (let i = cells.length - 1; i >= 2; i--) {
      const cell = cells[i].toUpperCase();
      if (cell.includes("QUESTIONABLE") || cell.includes("REFUTED") || cell.includes("MISSTATED")) {
        status = "questionable";
        break;
      }
      if (cell.includes("UNVERIFIED") || cell.includes("UNVERIFIABLE") || cell.includes("SUSPICIOUS")) {
        status = "unverified";
        break;
      }
      if (cell.includes("VERIFIED") || cell.includes("CONFIRMED") || cell.includes("PLAUSIBLE")) {
        if (!cell.includes("UNVERIFIED") && !cell.includes("PARTIALLY")) {
          status = "verified";
          break;
        }
        status = "unverified";
        break;
      }
    }

    if (!status) {
      if (line.includes("\u{1F6A9}")) status = "questionable";
      else if (line.includes("\u26A0\uFE0F")) status = "unverified";
      else if (line.includes("\u2705")) status = "verified";
    }

    if (status === "questionable") {
      questionable.push({ id: idMatch[1], text: claimText });
    } else if (status === "unverified") {
      unverified.push({ id: idMatch[1], text: claimText });
    } else if (status === "verified") {
      verifiedCount++;
    }
  }

  return {
    questionable: questionable.slice(0, 5),
    unverified: unverified.slice(0, 5),
    verifiedCount,
    totalQuestionable: questionable.length,
    totalUnverified: unverified.length,
  };
}

function extractRisksWithMitigation(md) {
  const riskSection = extractSection(md, "\\d+\\.\\s*Risk Matrix");
  if (!riskSection) return [];

  const risks = [];
  const lines = riskSection.split("\n");

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    let riskName, scoreStr, mitigation;

    if (/^\d+$/.test(cells[0])) {
      riskName = cells[1].replace(/\*\*/g, "");
      scoreStr = cells[4] || "";
      mitigation = cells[5] || "";
    } else {
      if (/risk/i.test(cells[0]) && /prob/i.test(cells[1])) continue;
      if (/^-+$/.test(cells[0])) continue;
      riskName = cells[0].replace(/\*\*/g, "");
      scoreStr = cells[3] || "";
      mitigation = cells[4] || "";
    }

    const scoreMatch = scoreStr.replace(/\*\*/g, "").match(/([\d.]+)/);
    if (!scoreMatch) continue;
    const score = parseFloat(scoreMatch[1]);
    if (isNaN(score)) continue;

    mitigation = mitigation.replace(/\*\*/g, "").trim();

    risks.push({ name: riskName, score, mitigation });
  }

  risks.sort((a, b) => b.score - a.score);
  return risks.slice(0, 5);
}

function extractGoDeeper(md) {
  const recSection = extractSection(md, "\\d+\\.\\s*Recommendation");
  if (!recSection) return { conditions: [], rationale: "" };

  const result = { conditions: [], rationale: "" };

  // Find the "what would change / revisit" block and extract full items with explanations
  const changeMatch = recSection.match(
    /\*\*(?:What would (?:change|make this worth)[^*]*|Conditions to (?:Revisit|Upgrade)[^*]*)\*\*[:\s]*([\s\S]*?)(?=\n\*\*[A-Z][^*]{0,30}\*\*(?!\.)|\n---|\n##|$)/i
  ) || recSection.match(
    /###?\s*(?:Conditions to Revisit|What Would Change)[^\n]*\n+([\s\S]*?)(?=###|\n##|$)/i
  );

  if (changeMatch) {
    const content = changeMatch[1].trim();
    // Split on numbered items: "1. **Bold.** explanation"
    const itemRegex = /\d+\.\s+\*\*(.+?)\*\*\s*([\s\S]*?)(?=\n\d+\.\s+\*\*|$)/g;
    let match;
    while ((match = itemRegex.exec(content)) !== null) {
      const condition = match[1].replace(/\.$/, "").trim();
      const explanation = match[2].trim();
      result.conditions.push({ condition, explanation });
    }

    // Fallback: bullet items with bold
    if (result.conditions.length === 0) {
      const lines = content.split("\n");
      for (const line of lines) {
        const bullet = line.match(/^[-*]\s+\*\*(.+?)\*\*\s*(.*)/);
        if (bullet) {
          result.conditions.push({
            condition: bullet[1].replace(/\.$/, "").trim(),
            explanation: bullet[2].trim(),
          });
        } else {
          const simpleBullet = line.match(/^[-*]\s+(.+)/);
          if (simpleBullet) {
            result.conditions.push({
              condition: simpleBullet[1].replace(/\*\*/g, "").trim(),
              explanation: "",
            });
          }
        }
      }
    }
  }

  // Fallback
  if (result.conditions.length === 0 && !result.rationale) {
    const paragraphs = recSection
      .split(/\n\n+/)
      .filter((p) => p.trim() && !p.trim().startsWith("#") && !p.trim().startsWith("|") && !p.trim().startsWith("---"));
    if (paragraphs.length > 0) {
      const text = paragraphs[0].replace(/\*\*/g, "").trim();
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      result.rationale = sentences.slice(0, 3).join(" ").trim();
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// New extractors
// ---------------------------------------------------------------------------

function extractCompanyDescription(md) {
  const execSection = extractSection(md, "\\d+\\.\\s*Executive Summary");
  if (!execSection) return "";
  const paragraphs = execSection
    .split(/\n\n+/)
    .filter((p) => p.trim() && !p.trim().startsWith("|") && !p.trim().startsWith("---") && !p.trim().startsWith("<!--"));
  return paragraphs.length > 0 ? paragraphs[0].trim() : "";
}

function extractLeadership(md) {
  const teamSection = extractSection(md, "\\d+\\.\\s*Team Assessment");
  if (!teamSection) return { verdict: "", people: [] };

  // Extract team verdict
  let verdict = "";
  const verdictMatch = teamSection.match(/\*\*(?:Team\s+)?Verdict:\s*([^*]+)\*\*/i);
  if (verdictMatch) {
    verdict = verdictMatch[1].trim();
  } else {
    const verdictLine = teamSection.match(/\*\*Verdict:\s*(.+?)\.?\*\*/i);
    if (verdictLine) verdict = verdictLine[1].trim();
  }

  // Parse people: look for bold name lines like **Name, Title** or **Name, Title —**
  const people = [];
  const personRegex = /\*\*([^*]+?(?:CEO|CTO|COO|CFO|CCO|VP|Head of|Director|President|Founder|Lab Manager)[^*]*?)\*\*\s*[—–-]?\s*([^\n]*)/gi;
  let match;
  while ((match = personRegex.exec(teamSection)) !== null) {
    if (people.length >= 3) break;
    const nameTitle = match[1].trim().replace(/\.$/, "");
    const assessment = match[2].trim().replace(/\.$/, "");
    // Also try to get the assessment from after the dash
    if (assessment) {
      people.push({ name: nameTitle, assessment });
    } else {
      people.push({ name: nameTitle, assessment: "" });
    }
  }

  // Fallback: try table-based team format
  if (people.length === 0) {
    const lines = teamSection.split("\n");
    for (const line of lines) {
      if (!line.trim().startsWith("|")) continue;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 3) continue;
      if (/^name$/i.test(cells[0]) || /^-+$/.test(cells[0])) continue;
      const name = cells[0].replace(/\*\*/g, "").trim();
      const role = cells[1].replace(/\*\*/g, "").trim();
      if (name && role && people.length < 3) {
        people.push({ name: `${name}, ${role}`, assessment: cells[2] ? cells[2].replace(/\*\*/g, "").trim() : "" });
      }
    }
  }

  return { verdict, people };
}

function extractTermsAnalysis(md) {
  // Try multiple section names
  const sectionNames = [
    "\\d+\\.\\s*Terms\\s*(?:&|and)?\\s*Valuation Assessment",
    "\\d+\\.\\s*Deal Terms Assessment",
    "\\d+\\.\\s*Terms Assessment",
  ];

  let termsSection = "";
  for (const name of sectionNames) {
    termsSection = extractSection(md, name);
    if (termsSection) break;
  }

  // Also check Financial Analysis for valuation content
  const finSection = extractSection(md, "\\d+\\.\\s*Financial Analysis");

  const result = {
    instrument: "",
    raiseAmount: "",
    valuation: "",
    closeDate: "",
    analysis: "",
    termsTable: [],
  };

  // Extract from Deal line
  const dealLine = extractDeal(md);
  if (dealLine) {
    // Parse instrument
    if (/SAFE/i.test(dealLine)) result.instrument = "SAFE";
    else if (/preferred/i.test(dealLine)) result.instrument = "Preferred Equity";
    else if (/convertible/i.test(dealLine)) result.instrument = "Convertible Note";

    // Parse raise amount
    const raiseMatch = dealLine.match(/\$(\d+(?:\.\d+)?)\s*M/i);
    if (raiseMatch) result.raiseAmount = `$${raiseMatch[1]}M`;

    // Parse valuation
    const valMatch = dealLine.match(/\$(\d+(?:\.\d+)?)\s*M\s*(?:pre[- ]money|post[- ]money|cap)/i);
    if (valMatch) {
      const type = /post/i.test(dealLine.slice(dealLine.indexOf(valMatch[0]))) ? "post-money" : "pre-money";
      result.valuation = `$${valMatch[1]}M ${type}`;
    }
  }

  // Close date
  const closeDateMatch = markdown.match(/\*\*Close Date:\*\*\s*(.+)/);
  if (closeDateMatch) result.closeDate = closeDateMatch[1].trim();

  // Try to parse the FIRST terms table from the terms section (stop after first table ends)
  if (termsSection) {
    const lines = termsSection.split("\n");
    let inFirstTable = false;
    let passedSeparator = false;
    for (const line of lines) {
      if (!line.trim().startsWith("|")) {
        if (inFirstTable && passedSeparator && result.termsTable.length > 0) break; // end of first table
        continue;
      }
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      // Skip separator
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        if (inFirstTable) passedSeparator = true;
        continue;
      }

      if (!inFirstTable) {
        inFirstTable = true;
        continue; // skip header row of first table
      }

      if (inFirstTable && passedSeparator) {
        const key = cells[0].replace(/\*\*/g, "").trim();
        const val = cells[1].replace(/\*\*/g, "").trim();
        if (key && val) {
          result.termsTable.push({ key, value: val });
        }
      }
    }
  }

  // Valuation analysis — look in financial section or terms section
  const analysisSource = termsSection || finSection || "";
  if (analysisSource) {
    // Priority 1: "### Valuation Assessment" subsection
    const valAssess = analysisSource.match(/### Valuation Assessment\n+([\s\S]*?)(?=\n###|\n---|\n\n\n|$)/i);
    if (valAssess) {
      result.analysis = valAssess[1].trim().split("\n\n")[0].replace(/\*\*/g, "").trim();
    }

    // Priority 2: "### Our View on Valuation" subsection
    if (!result.analysis) {
      const ourView = analysisSource.match(/### Our View on Valuation\n+([\s\S]*?)(?=\n###|\n---|\n\n\n|$)/i);
      if (ourView) {
        const firstParagraph = ourView[1].trim().split(/\n\n+/)[0];
        if (!firstParagraph.trim().startsWith("-") && !firstParagraph.trim().startsWith("*")) {
          result.analysis = firstParagraph.replace(/\*\*/g, "").trim();
        }
      }
    }

    // Priority 3: single-line sentences about valuation from the financial section
    if (!result.analysis && finSection) {
      const valLines = finSection.split("\n").filter((line) => {
        const lower = line.toLowerCase();
        return (lower.includes("valuation") || lower.includes("pre-money") || lower.includes("post-money")) &&
               (lower.includes("overpriced") || lower.includes("reasonable") || lower.includes("justified") ||
                lower.includes("aggressive") || lower.includes("defensible") || lower.includes("ceiling"));
      });
      if (valLines.length > 0) {
        result.analysis = valLines.slice(0, 2).join(" ").replace(/\*\*/g, "").trim();
      }
    }
  }

  return result;
}

function extractScenarioTable(md) {
  const finSection = extractSection(md, "\\d+\\.\\s*Financial Analysis");
  if (!finSection) return { rows: [], weightedReturn: "" };

  const result = { rows: [], weightedReturn: "" };

  // Look for scenario analysis table
  // Find the table after "Scenario Analysis" or "Scenario Summary"
  const scenarioBlock = finSection.match(/###?\s*Scenario (?:Analysis|Summary)[^|]*((?:\|[^\n]+\n)+)/i);
  if (scenarioBlock) {
    const tableLines = scenarioBlock[1].trim().split("\n");
    const headers = [];
    let headerParsed = false;

    for (const line of tableLines) {
      if (!line.trim().startsWith("|")) continue;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      if (/^-+$/.test(cells[0])) continue;

      if (!headerParsed) {
        for (const c of cells) headers.push(c.replace(/\*\*/g, "").trim());
        headerParsed = true;
        continue;
      }

      const row = {};
      cells.forEach((c, i) => {
        row[headers[i] || `col${i}`] = c.replace(/\*\*/g, "").trim();
      });
      result.rows.push(row);
    }
  }

  // If no table found via header, try to find any table with Bear/Base/Bull
  if (result.rows.length === 0) {
    const lines = finSection.split("\n");
    let inTable = false;
    const headers = [];
    for (const line of lines) {
      if (!line.trim().startsWith("|")) {
        if (inTable && result.rows.length > 0) break;
        continue;
      }
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 2) continue;
      if (/^-+$/.test(cells[0])) continue;

      // Check if this looks like a scenario table
      const joined = cells.join(" ").toLowerCase();
      if (joined.includes("bear") || joined.includes("base") || joined.includes("bull") || joined.includes("scenario") || joined.includes("metric")) {
        if (!inTable) {
          // This is the header row
          for (const c of cells) headers.push(c.replace(/\*\*/g, "").trim());
          inTable = true;
          continue;
        }
      }

      if (inTable || (joined.includes("bear") || joined.includes("base") || joined.includes("bull"))) {
        if (headers.length === 0) {
          // We hit data before headers — treat first row as headers
          for (const c of cells) headers.push(c.replace(/\*\*/g, "").trim());
          inTable = true;
          continue;
        }
        inTable = true;
        const row = {};
        cells.forEach((c, i) => {
          row[headers[i] || `col${i}`] = c.replace(/\*\*/g, "").trim();
        });
        result.rows.push(row);
      }
    }
  }

  // Extract weighted return
  const wrMatch = finSection.match(/(?:probability[- ]weighted|weighted)\s+expected\s+(?:return|ARR)[^:]*:\s*(?:~|approximately\s+)?([^\n]+)/i);
  if (wrMatch) {
    result.weightedReturn = wrMatch[1].trim();
  }

  return result;
}

function extractManagementQuestions(md) {
  const section = extractSection(md, "\\d+\\.\\s*Open Questions for Management");
  if (!section) return [];

  const questions = [];
  const regex = /^\d+\.\s+\*\*(.+?)\*\*/gm;
  let match;
  while ((match = regex.exec(section)) !== null) {
    questions.push(match[1].trim());
  }

  // Fallback: simple numbered list items
  if (questions.length === 0) {
    const numRegex = /^\d+\.\s+(.+)/gm;
    while ((match = numRegex.exec(section)) !== null) {
      const text = match[1].replace(/\*\*/g, "").trim();
      if (text.length > 10) questions.push(text);
    }
  }

  return questions.slice(0, 7);
}

function extractCompetitorTable(md) {
  const marketSection = extractSection(md, "\\d+\\.\\s*Market Opportunity");
  if (!marketSection) return [];

  // Look for a table with competitor info — it's typically the second table in the section
  // (the first is market sizing). We identify it by headers containing "competitor", "company",
  // "funding", or "threat".
  const lines = marketSection.split("\n");
  const competitors = [];
  let headers = [];
  let phase = "seeking"; // seeking -> found_header -> found_separator -> reading_data
  let tableCount = 0;

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      if (phase === "reading_data" && competitors.length > 0) break;
      // Reset between tables
      if (phase !== "seeking") {
        phase = "seeking";
        headers = [];
      }
      continue;
    }

    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    // Separator row
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      if (phase === "found_header") {
        // Check if these headers look like a competitor table
        const joined = headers.join(" ").toLowerCase();
        if (joined.includes("competitor") || joined.includes("company") || joined.includes("funding") || joined.includes("threat")) {
          phase = "found_separator";
        } else {
          // Not the table we want; skip this table
          phase = "skipping";
        }
      }
      continue;
    }

    if (phase === "seeking") {
      headers = cells.map((c) => c.replace(/\*\*/g, "").trim());
      phase = "found_header";
      continue;
    }

    if (phase === "found_separator") {
      phase = "reading_data";
    }

    if (phase === "reading_data") {
      const row = {};
      cells.forEach((c, i) => {
        row[headers[i] || `col${i}`] = c.replace(/\*\*/g, "").trim();
      });
      competitors.push(row);
    }
  }

  return competitors;
}

function extractMarketSizing(md) {
  const marketSection = extractSection(md, "\\d+\\.\\s*Market Opportunity");
  if (!marketSection) return [];

  // Find the first table in the market section (the sizing table, not competitor table)
  const lines = marketSection.split("\n");
  const rows = [];
  let headers = [];
  let inTable = false;
  let seenSeparator = false;

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      if (inTable && rows.length > 0) break;
      continue;
    }
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    // Check for separator row (---|---...)
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      seenSeparator = true;
      continue;
    }

    if (!inTable) {
      // First non-separator row in a table block is the header
      headers = cells.map((c) => c.replace(/\*\*/g, "").trim());
      inTable = true;
      continue;
    }

    if (inTable && seenSeparator) {
      const row = {};
      cells.forEach((c, i) => {
        row[headers[i] || `col${i}`] = c.replace(/\*\*/g, "").trim();
      });
      rows.push(row);
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Adversarial review extractors
// ---------------------------------------------------------------------------

function extractAdversarialSection(md) {
  // Match multiple heading formats:
  // # APPENDIX: ADVERSARIAL REVIEW
  // ## Appendix: Adversarial Review
  // # ADVERSARIAL REVIEW -- Appendix
  // # ADVERSARIAL REVIEW
  const match = md.match(/^#{1,2}\s+(?:(?:APPENDIX|Appendix):\s+)?(?:ADVERSARIAL REVIEW|Adversarial Review)/m);
  if (!match) return "";
  return md.slice(match.index + match[0].length).trim();
}

// Helper: extract a subsection from the adversarial appendix by keyword
// Handles ##/### with or without numbering, various casing
function extractAdvSubsection(adv, keyword) {
  if (!adv) return "";
  // Find the heading
  const headingPattern = new RegExp(
    `^(#{2,3})\\s+(?:\\d+\\.\\s+)?${keyword}[^\\n]*`,
    "mi"
  );
  const headingMatch = adv.match(headingPattern);
  if (!headingMatch) return "";

  const headingLevel = headingMatch[1].length; // 2 or 3
  const contentStart = headingMatch.index + headingMatch[0].length;
  const rest = adv.slice(contentStart);

  // Find the next heading at the same or higher level
  const nextHeadingPattern = new RegExp(
    `^#{2,${headingLevel}}\\s+(?:\\d+\\.\\s+)?\\S`,
    "m"
  );
  const nextMatch = rest.match(nextHeadingPattern);
  const content = nextMatch ? rest.slice(0, nextMatch.index) : rest;
  return content.trim();
}

function extractWeakestLink(md) {
  const content = extractAdvSubsection(extractAdversarialSection(md), "Weakest Link");
  if (!content) return "";
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.trim().startsWith("|"));
  if (paragraphs.length === 0) return "";
  let text = paragraphs[0].replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1").trim();
  if (text.length > 350) text = text.slice(0, 350).replace(/\s+\S*$/, "") + "...";
  return text;
}

function extractPreMortem(md) {
  const content = extractAdvSubsection(extractAdversarialSection(md), "Pre-?Mortem");
  if (!content) return "";
  const clean = (s) => s.replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1").trim();

  // Priority 1: Explicit "cause of death" / "root cause" / "most likely failure" labels
  const causePatterns = [
    /\*\*(?:Root cause of death|Root cause)[^*]*:\*\*\s*([^\n]+(?:\n(?!\*\*|\n|#{2,3})[^\n]+)*)/i,
    /\*\*(?:Most likely cause of death|Most probable cause)[^*]*:\*\*\s*([^\n]+(?:\n(?!\*\*|\n|#{2,3})[^\n]+)*)/i,
    /\*\*(?:Most likely failure mode|Proximate cause)[^*]*:\*\*\s*([^\n]+(?:\n(?!\*\*|\n|#{2,3})[^\n]+)*)/i,
  ];
  for (const pat of causePatterns) {
    const match = content.match(pat);
    if (match) {
      let text = clean(match[1]);
      if (text.length > 500) text = text.slice(0, 500).replace(/\s+\S*$/, "") + "...";
      return text;
    }
  }

  // Priority 2: Sentence containing "most likely failure" or "cause of death" inline
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.trim().startsWith("|") && !p.trim().startsWith("#") && !p.trim().startsWith("---"));
  const causeParagraph = paragraphs.find(p =>
    /most likely failure|cause of death|root cause|most probable failure|not the worst case/i.test(p)
  );
  if (causeParagraph) {
    let text = clean(causeParagraph);
    if (text.length > 500) text = text.slice(0, 500).replace(/\s+\S*$/, "") + "...";
    return text;
  }

  // Priority 3: Last substantive paragraph (often the synthesis/conclusion)
  const substantive = paragraphs.filter(p => clean(p).length > 50);
  if (substantive.length > 0) {
    let text = clean(substantive[substantive.length - 1]);
    if (text.length > 500) text = text.slice(0, 500).replace(/\s+\S*$/, "") + "...";
    // Skip if it's just the preamble
    if (/^It is.*\. (?:The investment has failed|Here is what happened|We passed)/i.test(text)) {
      // Try second to last
      if (substantive.length > 1) {
        text = clean(substantive[substantive.length - 2]);
        if (text.length > 500) text = text.slice(0, 500).replace(/\s+\S*$/, "") + "...";
        return text;
      }
    }
    return text;
  }

  return "";
}

function extractKillerQuestion(md) {
  const adv = extractAdversarialSection(md);
  if (!adv) return "";
  // Try multiple patterns for the killer question

  // Pattern 1: **If I/you could ask...:** \n *"question"*
  const p1 = adv.match(/\*\*If (?:I|you) could ask[^*]+question:\*\*\s*\n+\s*\*[\u201c"]([\s\S]*?)[\u201d"]\*/);
  if (p1) return p1[1].replace(/\n/g, " ").trim();

  // Pattern 2: **If I/you could ask...:** \n *question*
  const p2 = adv.match(/\*\*If (?:I|you) could ask[^*]+question:\*\*\s*\n+\s*\*([\s\S]*?)\*\s*\n/);
  if (p2) return p2[1].replace(/^[\u201c"]+|[\u201d"]+$/g, "").replace(/\n/g, " ").trim();

  // Pattern 3: **If I/you could ask...:** "inline question"
  const p3 = adv.match(/\*\*If (?:I|you) could ask[^*]+question:\*\*\s*[\u201c"]([^\u201d"]+)[\u201d"]/);
  if (p3) return p3[1].trim();

  // Pattern 4: **The kill question for the founder:** "question"
  const p4 = adv.match(/\*\*(?:The )?kill question[^:]*:\*\*\s*[\u201c"]([^\u201d"]+)[\u201d"]/);
  if (p4) return p4[1].trim();

  return "";
}

function extractConfidence(md) {
  const adv = extractAdversarialSection(md);
  if (!adv) return "";
  // Get the full confidence line with context
  const match = adv.match(/\*\*Confidence[^:]*:\s*([^*\n]+)\*\*/i) ||
                adv.match(/\*\*Confidence[^:]*:\*\*\s*([^\n]+)/i);
  if (!match) return "";
  // Return the full first sentence — includes the level AND the reasoning
  let text = match[1].replace(/\*\*/g, "").trim();
  // Cap at first two sentences for brevity
  const sentences = text.match(/[^.!]+[.!]+/g);
  if (sentences && sentences.length > 2) {
    text = sentences.slice(0, 2).join("").trim();
  }
  return text;
}

function extractThesisSurvival(md) {
  const adv = extractAdversarialSection(md);
  if (!adv) return "";
  // Match "Does the [X] thesis survive?" or "Does the thesis survive?"
  const match = adv.match(/\*\*Does the (?:\w+\s+)?thesis survive\??\*\*\s*([^\n]+)/i);
  if (match) return match[1].replace(/\*\*/g, "").trim();
  return "";
}

function extractBiggestUnderweightedRisk(md) {
  const adv = extractAdversarialSection(md);
  if (!adv) return "";
  const match = adv.match(/\*\*Biggest (?:risk|underweighted risk)[^:]*:\*\*\s*([^\n]+)/i);
  if (match) return match[1].replace(/\*\*/g, "").trim();
  return "";
}

// ---------------------------------------------------------------------------
// Extract all data
// ---------------------------------------------------------------------------

const companyName = extractH1Title(markdown);
const date = extractDate(markdown);

// Detect fund vs deal memo
const isFundMemo = /People Assessment|Philosophy Assessment|Fund Score|GP Quality/i.test(markdown)
  && /Performance.*Fee|5P/i.test(markdown);

const deal = extractDeal(markdown);
const { verdict: rawVerdict, color: rawVerdictColor } = extractVerdict(markdown);
// Map NEED MORE INFO and fund-specific verdicts
let verdict = rawVerdict;
if (verdict === "NEED MORE INFO") verdict = "CONDITIONAL PROCEED";
if (/CONDITIONAL COMMIT/i.test(verdict)) verdict = "CONDITIONAL COMMIT";
if (/^COMMIT$/i.test(verdict)) verdict = "COMMIT";
const verdictColor = rawVerdictColor;

const companyDescription = extractCompanyDescription(markdown);
const bottomLine = extractBottomLine(markdown);
const fullExecSummary = extractFullExecSummary(markdown);

// Dimension prose sections — concise analysis per area
const teamProse = extractSectionProse(markdown, "\\d+\\.\\s*Team Assessment", 2);
const marketProse = extractSectionProse(markdown, "\\d+\\.\\s*Market Opportunity", 2);
const financialProse = extractSectionProse(markdown, "\\d+\\.\\s*Financial Analysis", 2);

// Leadership — for funds, extract GP info from People Assessment
let leadership;
if (isFundMemo) {
  const peopleSection = extractSection(markdown, "\\d+\\.\\s*People Assessment");
  const people = [];
  let teamVerdict = "";
  if (peopleSection) {
    // Extract verdict line
    const verdictMatch = peopleSection.match(/\*\*(?:Verdict|Assessment|Overall):\s*([^*]+)\*\*/i);
    if (verdictMatch) teamVerdict = verdictMatch[1].trim();
    // Extract GP names
    const personRegex = /\*\*([^*]+)\*\*\s*(?:—|--|-)\s*([^\n]+)/g;
    let m;
    while ((m = personRegex.exec(peopleSection)) && people.length < 4) {
      const name = m[1].trim();
      if (name.length > 3 && name.length < 60 && !/Verdict|Assessment|Overall/i.test(name)) {
        people.push({ name, assessment: m[2].trim().slice(0, 120) });
      }
    }
  }
  // Fallback: extract GP from header
  if (people.length === 0) {
    const gpLine = markdown.match(/\*\*GP:\*\*\s*(.+)/);
    if (gpLine) people.push({ name: gpLine[1].trim(), assessment: "" });
  }
  leadership = { people, verdict: teamVerdict };
} else {
  leadership = extractLeadership(markdown);
}

// Terms — for funds, extract fund terms from header
let termsAnalysis;
if (isFundMemo) {
  const fundLine = markdown.match(/\*\*Fund:\*\*\s*(.+)/);
  const stratLine = markdown.match(/\*\*Strategy:\*\*\s*(.+)/);
  const gpLine = markdown.match(/\*\*GP:\*\*\s*(.+)/);
  const termsTable = [];
  if (fundLine) termsTable.push({ key: "Fund", value: fundLine[1].trim() });
  if (gpLine) termsTable.push({ key: "GP", value: gpLine[1].trim() });
  if (stratLine) termsTable.push({ key: "Strategy", value: stratLine[1].trim() });
  // Extract fee info from Performance section
  let analysis = "";
  const perfSection = extractSection(markdown, "\\d+\\.\\s*Performance");
  if (perfSection) {
    const feeMatch = perfSection.match(/(?:fee|carry|management)[^.]*\./gi);
    if (feeMatch) analysis = feeMatch.slice(0, 3).join(" ");
  }
  termsAnalysis = {
    instrument: null,
    raiseAmount: fundLine ? fundLine[1].trim() : null,
    valuation: null,
    closeDate: null,
    termsTable,
    analysis,
  };
} else {
  termsAnalysis = extractTermsAnalysis(markdown);
}

// Bull/Bear — for funds, use strengths from People/Philosophy and risks from Key Risks
let bullCase, bearCase;
if (isFundMemo) {
  // Extract strengths from exec summary or individual P sections
  bullCase = [];
  bearCase = [];
  // Try to find numbered strengths/concerns in any section
  const execSection = extractSection(markdown, "\\d+\\.\\s*Executive Summary");
  if (execSection) {
    const bullets = execSection.match(/\*\*\d+\.\s+[^*]+\*\*/g) || [];
    bullets.slice(0, 5).forEach(b => {
      const text = b.replace(/\*\*/g, "").replace(/^\d+\.\s*/, "").trim();
      if (text.length > 10) bullCase.push(text);
    });
  }
  // Bear case from Key Risks
  const riskSection = extractSection(markdown, "\\d+\\.\\s*Key Risks");
  if (riskSection) {
    const riskLines = riskSection.match(/\*\*([^*]{10,})\*\*/g) || [];
    riskLines.slice(0, 5).forEach(r => {
      const text = r.replace(/\*\*/g, "").trim();
      if (text.length > 10 && !/^#|Rank|Risk/.test(text)) bearCase.push(text);
    });
  }
} else {
  bullCase = extractBullCase(markdown);
  bearCase = extractBearCase(markdown);
}

// Scores — for funds, look for "Fund Score" section
let scores, totalScore;
if (isFundMemo) {
  scores = [];
  let scoreSection = extractSection(markdown, "\\d+\\.\\s*Fund Score");
  if (!scoreSection) scoreSection = extractSection(markdown, "5P Scoring");
  if (!scoreSection) scoreSection = extractSection(markdown, "Fund Score");
  if (scoreSection) {
    const lines = scoreSection.split("\n");
    let hitTotal = false;
    for (const line of lines) {
      if (!line.trim().startsWith("|")) continue;
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;
      const name = cells[0].replace(/\*\*/g, "").trim();
      // Stop at Subtotal/Total row — don't parse subsequent tables
      if (/^(sub)?total$/i.test(name)) { hitTotal = true; continue; }
      if (/^dimension$/i.test(name) || /^-+$/.test(name) || /^score$/i.test(name)) continue;
      // After hitting a total, only accept Impact Integrity rows (they come right after)
      if (hitTotal && !/impact/i.test(name)) continue;
      const weightMatch = cells[1].match(/([\d.]+)%/);
      if (!weightMatch) continue;
      const scoreVal = parseFloat(cells[2]);
      if (isNaN(scoreVal) || scoreVal > 10) continue; // Filter out scores > 10 (misread weight columns)
      let rationale = "";
      if (cells.length >= 5) {
        rationale = cells[4].replace(/\*\*/g, "").replace(/\[P\d\]/g, "").trim();
      }
      // Truncate rationale for display
      if (rationale.length > 150) rationale = rationale.slice(0, 147) + "...";
      scores.push({ name, weight: parseFloat(weightMatch[1]), score: scoreVal, rationale });
    }
  }
  // Total score — look for adversarial-adjusted or raw total
  const adjMatch = (scoreSection || markdown).match(/(?:final|adjusted)\s+(?:weighted\s+)?score[^.:]*?(?::|is|of)\s*([\d.]+)/i);
  const slashMatch = (scoreSection || "").match(/([\d.]+)\/10/);
  const rawMatch = (scoreSection || "").match(/\*\*([\d.]+)\*\*/);
  totalScore = adjMatch ? parseFloat(adjMatch[1]) : slashMatch ? parseFloat(slashMatch[1]) : rawMatch ? parseFloat(rawMatch[1]) : null;
} else {
  scores = extractScores(markdown);
  totalScore = extractTotalScore(markdown);
}

const claimDetails = extractClaimDetails(markdown);

// Risks — for funds, look for "Key Risks" section with different table format
let risksWithMitigation;
if (isFundMemo) {
  risksWithMitigation = [];
  const riskSection = extractSection(markdown, "\\d+\\.\\s*Key Risks");
  if (riskSection) {
    const lines = riskSection.split("\n");
    for (const line of lines) {
      if (!line.trim().startsWith("|")) continue;
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;
      // Format: | # | Risk | Severity | Probability | Assessment |
      const riskName = cells[1] ? cells[1].replace(/\*\*/g, "").trim() : "";
      if (!riskName || /^Risk$/i.test(riskName) || /^-+$/.test(riskName)) continue;
      const severity = cells[2] || "";
      const assessment = cells.length >= 5 ? cells[4].replace(/\*\*/g, "").trim() : "";
      // Map severity to numeric score for display
      const sevMap = { "critical": 25, "high": 16, "medium-high": 12, "medium": 9, "low": 4 };
      const sevScore = sevMap[severity.toLowerCase()] || 9;
      risksWithMitigation.push({ name: riskName, score: sevScore, mitigation: assessment.slice(0, 150) });
    }
    risksWithMitigation = risksWithMitigation.slice(0, 5);
  }
} else {
  risksWithMitigation = extractRisksWithMitigation(markdown);
}

const scenarioData = extractScenarioTable(markdown);
const goDeeper = extractGoDeeper(markdown);

// Management questions — for funds, section is "Open Questions for GP Meeting"
let managementQuestions;
if (isFundMemo) {
  managementQuestions = [];
  const qSection = extractSection(markdown, "\\d+\\.\\s*Open Questions for GP");
  if (qSection) {
    const qRegex = /^\d+\.\s+\*\*([^*]+)\*\*\.?\s*(.*)/gm;
    let m;
    while ((m = qRegex.exec(qSection)) && managementQuestions.length < 7) {
      const q = m[2] ? m[1].trim() + " — " + m[2].trim().slice(0, 100) : m[1].trim();
      managementQuestions.push(q);
    }
  }
} else {
  managementQuestions = extractManagementQuestions(markdown);
}

const competitorTable = isFundMemo ? null : extractCompetitorTable(markdown);
const marketSizing = isFundMemo ? null : extractMarketSizing(markdown);

// Adversarial review content
const weakestLink = extractWeakestLink(markdown);
const preMortem = extractPreMortem(markdown);
const killerQuestion = extractKillerQuestion(markdown);
const confidence = extractConfidence(markdown);
const thesisSurvival = extractThesisSurvival(markdown);
const biggestUnderweightedRisk = extractBiggestUnderweightedRisk(markdown);

// ---------------------------------------------------------------------------
// Score display config
// ---------------------------------------------------------------------------
const totalScoreDisplay = totalScore !== null ? `${totalScore}/10` : "\u2014";
const totalScoreColor =
  totalScore >= 7 ? COLORS.green : totalScore >= 5 ? COLORS.amber : COLORS.red;

// ---------------------------------------------------------------------------
// HTML section builders
// ---------------------------------------------------------------------------

// Section numbering is applied dynamically after all sections are built
// so empty sections don't create gaps
function sectionHeader(placeholder, title, borderColor) {
  borderColor = borderColor || COLORS.navy;
  return `<h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin: 36px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid ${borderColor};">${escapeHtml(title)}</h2>`;
}

function emptyWarning(sectionName) {
  return `<div style="padding: 12px 16px; background: ${COLORS.lightGray}; border-left: 3px solid ${COLORS.border}; border-radius: 4px; font-size: 13px; color: ${COLORS.muted}; font-style: italic;">Section not extracted from memo — see full analysis for ${sectionName} details.</div>`;
}

function buildClaimHeatmap() {
  const { verifiedCount, totalQuestionable, totalUnverified } = claimDetails;
  const total = verifiedCount + (totalQuestionable || 0) + (totalUnverified || 0);
  if (total === 0) return "";

  return `
    <div style="display: flex; gap: 8px; margin-top: 16px; margin-bottom: 8px;">
      <div style="flex: 1; text-align: center; padding: 10px; background: ${COLORS.green}12; border: 1px solid ${COLORS.green}40; border-radius: 6px;">
        <div style="font-size: 20px; font-weight: 700; color: ${COLORS.green};">✅ ${verifiedCount}</div>
        <div style="font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Verified</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 10px; background: ${COLORS.amber}12; border: 1px solid ${COLORS.amber}40; border-radius: 6px;">
        <div style="font-size: 20px; font-weight: 700; color: ${COLORS.amber};">⚠️ ${totalUnverified || 0}</div>
        <div style="font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Unverified</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 10px; background: ${COLORS.red}12; border: 1px solid ${COLORS.red}40; border-radius: 6px;">
        <div style="font-size: 20px; font-weight: 700; color: ${COLORS.red};">🚩 ${totalQuestionable || 0}</div>
        <div style="font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Questionable</div>
      </div>
    </div>`;
}

function buildCompanyOverview() {
  let html = sectionHeader("III", "Company Overview");

  // What they do
  if (companyDescription) {
    html += `<div style="margin-bottom: 20px;">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${COLORS.muted}; margin-bottom: 8px;">What They Do</div>
      <div style="font-size: 14px; line-height: 1.65; color: ${COLORS.body};">${mdBoldToHtml(companyDescription)}</div>
    </div>`;
  }

  // Leadership
  if (leadership.people.length > 0 || leadership.verdict) {
    html += `<div style="margin-bottom: 8px;">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${COLORS.muted}; margin-bottom: 8px;">Leadership</div>`;

    if (leadership.verdict) {
      html += `<div style="font-size: 13px; font-weight: 600; color: ${COLORS.navy}; margin-bottom: 10px; padding: 8px 12px; background: ${COLORS.lightGray}; border-radius: 4px;">Team Verdict: ${escapeHtml(leadership.verdict)}</div>`;
    }

    if (leadership.people.length > 0) {
      html += leadership.people.map((p) =>
        `<div style="padding: 6px 0; font-size: 13px; line-height: 1.5; border-bottom: 1px solid ${COLORS.lightGray};">
          <strong>${escapeHtml(p.name)}</strong>${p.assessment ? ` \u2014 ${escapeHtml(p.assessment)}` : ""}
        </div>`
      ).join("\n");
    }

    html += `</div>`;
  }

  return html;
}

function buildDealTerms() {
  const t = termsAnalysis;
  if (!t.instrument && !t.raiseAmount && !t.valuation && t.termsTable.length === 0 && !deal) return "";

  let html = sectionHeader("IV", "Deal Terms");

  // Key-value table
  const kvPairs = [];
  if (t.instrument) kvPairs.push(["Instrument", t.instrument]);
  if (t.raiseAmount) kvPairs.push(["Raise Amount", t.raiseAmount]);
  if (t.valuation) kvPairs.push(["Valuation", t.valuation]);
  if (t.closeDate) kvPairs.push(["Close Date", t.closeDate]);

  // Add parsed terms table rows if different from above
  for (const row of t.termsTable) {
    const existing = kvPairs.find((kv) => kv[0].toLowerCase() === row.key.toLowerCase());
    if (!existing && kvPairs.length < 8) {
      kvPairs.push([row.key, row.value]);
    }
  }

  if (kvPairs.length > 0) {
    html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
      <thead>
        <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
          <th style="padding: 8px 12px; text-align: left; font-weight: 600; width: 35%;">Term</th>
          <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Value</th>
        </tr>
      </thead>
      <tbody>
        ${kvPairs.map((kv, i) =>
          `<tr style="background: ${i % 2 === 0 ? COLORS.white : COLORS.lightGray};">
            <td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(kv[0])}</td>
            <td style="padding: 8px 12px;">${escapeHtml(kv[1])}</td>
          </tr>`
        ).join("\n")}
      </tbody>
    </table>`;
  }

  // Valuation analysis
  if (t.analysis) {
    html += `<div style="font-size: 13px; line-height: 1.6; color: ${COLORS.body}; padding: 12px 16px; background: ${COLORS.lightGray}; border-radius: 6px; border-left: 3px solid ${COLORS.amber};">${mdBoldToHtml(t.analysis)}</div>`;
  }

  return html;
}

function buildMarketCompetition() {
  if ((!marketSizing || marketSizing.length === 0) && (!competitorTable || competitorTable.length === 0)) return "";

  let html = sectionHeader("V", "Market & Competition");

  // Market sizing table
  if (marketSizing.length > 0) {
    const headers = Object.keys(marketSizing[0]);
    html += `<div style="margin-bottom: 20px;">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${COLORS.muted}; margin-bottom: 8px;">Market Sizing</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
            ${headers.map((h) => `<th style="padding: 6px 10px; text-align: left; font-weight: 600;">${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${marketSizing.map((row, i) =>
            `<tr style="background: ${i % 2 === 0 ? COLORS.white : COLORS.lightGray};">
              ${headers.map((h) => `<td style="padding: 6px 10px;">${escapeHtml(row[h] || "")}</td>`).join("")}
            </tr>`
          ).join("\n")}
        </tbody>
      </table>
    </div>`;
  }

  // Competitor table
  if (competitorTable.length > 0) {
    const headers = Object.keys(competitorTable[0]);
    html += `<div>
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${COLORS.muted}; margin-bottom: 8px;">Competitive Landscape</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
            ${headers.map((h) => `<th style="padding: 6px 10px; text-align: left; font-weight: 600;">${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${competitorTable.map((row, i) =>
            `<tr style="background: ${i % 2 === 0 ? COLORS.white : COLORS.lightGray};">
              ${headers.map((h) => `<td style="padding: 6px 10px;">${escapeHtml(row[h] || "")}</td>`).join("")}
            </tr>`
          ).join("\n")}
        </tbody>
      </table>
    </div>`;
  }

  return html;
}

function buildBullBear() {
  if (bullCase.length === 0 && bearCase.length === 0) return "";

  const buildColumn = (items, label, color) => {
    if (items.length === 0)
      return `<div style="flex: 1;"><p style="color: ${COLORS.muted}; font-size: 13px; font-style: italic;">See full memo for ${label.toLowerCase()} analysis.</p></div>`;
    const listHtml = items
      .map(
        (item, i) =>
          `<div style="padding: 8px 12px; margin-bottom: 6px; border-left: 3px solid ${color}; background: ${color}0A; border-radius: 0 4px 4px 0; font-size: 13px; line-height: 1.4;">${i + 1}. ${escapeHtml(item)}</div>`
      )
      .join("\n");
    return `
    <div style="flex: 1;">
      <div style="font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${color}; margin-bottom: 10px;">${escapeHtml(label)}</div>
      ${listHtml}
    </div>`;
  };

  let html = sectionHeader("VI", "The Case For & Against");
  html += `<div style="display: flex; gap: 20px;">
    ${buildColumn(bullCase, "Bull Case", COLORS.green)}
    ${buildColumn(bearCase, "Bear Case", COLORS.red)}
  </div>`;

  return html;
}

function buildRisks() {
  if (risksWithMitigation.length === 0) return "";

  const maxScore = Math.max(...risksWithMitigation.map((r) => r.score));
  const isIntegerScale = maxScore > 5;

  function severityLabel(score) {
    const pct = isIntegerScale ? (score / 25) * 100 : (score / 3) * 100;
    if (pct >= 64) return { label: "Critical", color: COLORS.red };
    if (pct >= 40) return { label: "High", color: COLORS.red };
    if (pct >= 24) return { label: "Medium", color: COLORS.amber };
    return { label: "Low", color: COLORS.green };
  }

  let html = sectionHeader("VII", "Key Risks & Red Flags");

  html += risksWithMitigation
    .map((r, i) => {
      const { label, color } = severityLabel(r.score);
      return `
      <div style="margin-bottom: 14px; padding: 10px 14px; border-left: 4px solid ${color}; background: ${COLORS.lightGray}; border-radius: 0 6px 6px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${r.mitigation ? "6" : "0"}px;">
          <span style="font-weight: 600; font-size: 14px;">${i + 1}. ${escapeHtml(r.name)}</span>
          <span style="font-weight: 700; color: ${color}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; margin-left: 12px; padding: 3px 10px; background: ${color}15; border-radius: 3px;">${label}</span>
        </div>${
          r.mitigation
            ? `\n        <div style="font-size: 12px; color: ${COLORS.muted}; line-height: 1.5;"><strong>Mitigation:</strong> ${escapeHtml(r.mitigation)}</div>`
            : ""
        }
      </div>`;
    })
    .join("\n");

  return html;
}

function buildScenarioAnalysis() {
  if (scenarioData.rows.length === 0 && !scenarioData.weightedReturn) return "";

  let html = sectionHeader("VIII", "Scenario Analysis");

  if (scenarioData.rows.length > 0) {
    const headers = Object.keys(scenarioData.rows[0]);
    html += `<table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px;">
      <thead>
        <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
          ${headers.map((h) => `<th style="padding: 8px 10px; text-align: left; font-weight: 600;">${escapeHtml(h)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${scenarioData.rows.map((row, i) => {
          // Color the first cell based on scenario type
          const firstVal = (row[headers[0]] || "").toLowerCase();
          let rowBorder = "";
          if (firstVal.includes("bear")) rowBorder = `border-left: 3px solid ${COLORS.red};`;
          else if (firstVal.includes("base")) rowBorder = `border-left: 3px solid ${COLORS.amber};`;
          else if (firstVal.includes("bull")) rowBorder = `border-left: 3px solid ${COLORS.green};`;
          return `<tr style="background: ${i % 2 === 0 ? COLORS.white : COLORS.lightGray}; ${rowBorder}">
            ${headers.map((h) => `<td style="padding: 8px 10px;">${escapeHtml(row[h] || "")}</td>`).join("")}
          </tr>`;
        }).join("\n")}
      </tbody>
    </table>`;
  }

  if (scenarioData.weightedReturn) {
    html += `<div style="font-size: 13px; padding: 10px 14px; background: ${COLORS.lightGray}; border-radius: 6px; border-left: 3px solid ${COLORS.navy}; line-height: 1.5;">
      <strong>Probability-weighted expected return:</strong> ${escapeHtml(scenarioData.weightedReturn)}
    </div>`;
  }

  return html;
}

function buildWhatWouldChange() {
  const { conditions, rationale } = goDeeper;
  if (conditions.length === 0 && !rationale) return "";

  let html = sectionHeader("IX", "What Would Change Our View", COLORS.amber);

  if (conditions.length > 0) {
    html += conditions.map((item) => {
      const cond = typeof item === "string" ? item : item.condition;
      const expl = typeof item === "string" ? "" : item.explanation;
      return `<div style="margin-bottom: 16px;">
        <div style="font-size: 14px; font-weight: 600; color: ${COLORS.navy}; margin-bottom: 4px;">${escapeHtml(cond)}</div>
        ${expl ? `<div style="font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">${mdBoldToHtml(expl)}</div>` : ""}
      </div>`;
    }).join("\n");
  }

  if (rationale) {
    html += `<div style="font-size: 13px; color: ${COLORS.body}; line-height: 1.6;">${mdBoldToHtml(rationale)}</div>`;
  }

  return html;
}

function buildManagementQuestions() {
  if (managementQuestions.length === 0) return "";

  let html = sectionHeader("X", "Key Questions for Management");

  html += `<ol style="margin: 0; padding-left: 20px; color: ${COLORS.body};">
    ${managementQuestions.map((q) =>
      `<li style="margin-bottom: 10px; font-size: 13px; line-height: 1.6;">${escapeHtml(q)}</li>`
    ).join("\n")}
  </ol>`;

  return html;
}

function buildScoreSummary() {
  if (scores.length === 0) return "";

  let html = sectionHeader("XI", "Score Summary");

  html += `<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px;">
    <thead>
      <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
        <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Dimension</th>
        <th style="padding: 8px 12px; text-align: center; font-weight: 600; width: 70px;">Score</th>
        <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${scores.map((s, i) => {
        const scoreColor = s.score >= 7 ? COLORS.green : s.score >= 5 ? COLORS.amber : COLORS.red;
        return `<tr style="background: ${i % 2 === 0 ? COLORS.white : COLORS.lightGray};">
          <td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(s.name)} <span style="color: ${COLORS.muted}; font-size: 11px;">(${s.weight}%)</span></td>
          <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: ${scoreColor};">${s.score}/10</td>
          <td style="padding: 8px 12px; font-size: 12px; color: ${COLORS.muted};">${escapeHtml(s.rationale || "")}</td>
        </tr>`;
      }).join("\n")}
      <tr style="background: ${COLORS.navy}; color: ${COLORS.white};">
        <td style="padding: 10px 12px; font-weight: 700;">TOTAL</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 800; font-size: 16px;">${totalScoreDisplay}</td>
        <td style="padding: 10px 12px;">
          ${claimDetails.verifiedCount > 0 || claimDetails.totalQuestionable > 0 || claimDetails.totalUnverified > 0
            ? `<span style="font-size: 11px; opacity: 0.9;">Claims: ${claimDetails.verifiedCount} verified, ${claimDetails.totalUnverified} unverified, ${claimDetails.totalQuestionable} questionable</span>`
            : ""}
        </td>
      </tr>
    </tbody>
  </table>`;

  // Add claim heatmap below score table
  html += buildClaimHeatmap();

  return html;
}

// ---------------------------------------------------------------------------
// Assemble HTML
// ---------------------------------------------------------------------------

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(companyName)} \u2014 Executive Brief</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: ${COLORS.body};
      background: ${COLORS.white};
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { background: white; margin: 0; }
      .container { box-shadow: none !important; max-width: 100% !important; }
      h2 { page-break-before: auto; page-break-after: avoid; }
      table, .risk-card, .scenario-table { page-break-inside: avoid; }
      .exec-summary { page-break-inside: avoid; }
    }
    .container {
      max-width: 780px;
      margin: 0 auto;
      padding: 0;
    }
    table { border: 1px solid ${COLORS.border}; }
    th, td { border: 1px solid ${COLORS.border}; }
  </style>
</head>
<body>
  <div class="container">

    <!-- I. Header -->
    <div style="background: ${COLORS.navy}; color: ${COLORS.white}; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${escapeHtml(companyName || "Investment Memo")}</div>
        ${deal ? `<div style="font-size: 13px; opacity: 0.8; margin-top: 6px;">${escapeHtml(deal)}</div>` : ""}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.7;">${stageLabel}</div>
        <div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">${escapeHtml(date)}</div>
      </div>
    </div>

    <!-- II. Score Overview -->
    ${totalScore !== null ? `
    <div style="padding: 24px 32px; background: ${COLORS.white}; border-bottom: 1px solid ${COLORS.border};">
      <div style="display: flex; align-items: center; gap: 28px;">
        <div>
          <div style="font-size: 42px; font-weight: 800; color: ${totalScoreColor}; line-height: 1;">${totalScoreDisplay}</div>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${scores.map(s => {
              const c = s.score >= 7 ? COLORS.green : s.score >= 5 ? COLORS.amber : COLORS.red;
              const barWidth = Math.round(s.score * 10);
              return `<div style="flex: 1 1 140px; min-width: 140px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: ${COLORS.muted}; margin-bottom: 3px;">
                  <span>${escapeHtml(s.name)}</span><span style="font-weight: 700; color: ${c};">${s.score}</span>
                </div>
                <div style="height: 6px; background: ${COLORS.lightGray}; border-radius: 3px;">
                  <div style="height: 6px; width: ${barWidth}%; background: ${c}; border-radius: 3px;"></div>
                </div>
              </div>`;
            }).join("\n")}
          </div>
        </div>
      </div>
    </div>` : ""}

    <!-- Analysis -->
    <div style="padding: 0 32px 28px 32px;">

      ${fullExecSummary.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.navy};">Analysis</h2>
        ${fullExecSummary.map((p) =>
          `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${mdBoldToHtml(p)}</p>`
        ).join("\n")}
      </div>` : ""}

      ${bullCase.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.green};">Why This Is Interesting</h2>
        ${bullCase.map((item) => {
          if (typeof item === "string") return `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${escapeHtml(item)}</p>`;
          return `<div style="margin-bottom: 16px;">
            <p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7;"><strong>${escapeHtml(item.headline)}.</strong> ${mdBoldToHtml(item.explanation)}</p>
          </div>`;
        }).join("\n")}
      </div>` : ""}

      ${bearCase.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.red};">Why You Should Be Careful</h2>
        ${bearCase.map((item) => {
          if (typeof item === "string") return `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${escapeHtml(item)}</p>`;
          return `<div style="margin-bottom: 16px;">
            <p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7;"><strong>${escapeHtml(item.headline)}.</strong> ${mdBoldToHtml(item.explanation)}</p>
          </div>`;
        }).join("\n")}
      </div>` : ""}

      ${teamProse.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.navy};">Team</h2>
        ${teamProse.map((p) =>
          `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${mdBoldToHtml(p)}</p>`
        ).join("\n")}
      </div>` : ""}

      ${marketProse.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.navy};">Market</h2>
        ${marketProse.map((p) =>
          `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${mdBoldToHtml(p)}</p>`
        ).join("\n")}
      </div>` : ""}

      ${financialProse.length > 0 ? `
      <div style="margin-top: 28px;">
        <h2 style="color: ${COLORS.navy}; font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${COLORS.navy};">Financials</h2>
        ${financialProse.map((p) =>
          `<p style="font-size: 14px; color: ${COLORS.body}; line-height: 1.7; margin-bottom: 14px;">${mdBoldToHtml(p)}</p>`
        ).join("\n")}
      </div>` : ""}

      ${buildManagementQuestions()}

      ${buildWhatWouldChange()}

      <!-- Analyst's Take -->
      ${(weakestLink || preMortem || killerQuestion) ? `
      <div style="margin-top: 28px; padding: 24px; background: ${COLORS.navy}; color: ${COLORS.white}; border-radius: 8px;">
        <div style="font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.6; margin-bottom: 16px;">Analyst's Take</div>
        ${thesisSurvival ? `<div style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; opacity: 0.95;"><strong>Does the thesis survive?</strong> ${escapeHtml(thesisSurvival)}</div>` : ""}
        ${weakestLink ? `<div style="margin-bottom: 14px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 4px;">Weakest Link</div>
          <div style="font-size: 13px; line-height: 1.55; opacity: 0.9;">${escapeHtml(weakestLink)}</div>
        </div>` : ""}
        ${preMortem ? `<div style="margin-bottom: 14px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 4px;">Most Probable Failure</div>
          <div style="font-size: 13px; line-height: 1.55; opacity: 0.9;">${escapeHtml(preMortem)}</div>
        </div>` : ""}
        ${killerQuestion ? `<div style="margin-bottom: 14px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 4px;">Killer Question</div>
          <div style="font-size: 13px; line-height: 1.55; opacity: 0.9; font-style: italic;">\u201c${escapeHtml(killerQuestion)}\u201d</div>
        </div>` : ""}
        ${confidence ? `<div style="font-size: 12px; opacity: 0.5; margin-top: 8px;">Confidence: ${escapeHtml(confidence)}</div>` : ""}
      </div>` : ""}

      <!-- Footer -->
      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid ${COLORS.border}; font-size: 12px; color: ${COLORS.muted}; display: flex; justify-content: space-between;">
        <span>Full memo: ${escapeHtml(path.basename(inputPath))}</span>
        <span>Generated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
      </div>

    </div>
  </div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Score math validation
// ---------------------------------------------------------------------------
const warnings = [];

if (scores.length > 0) {
  // Check weights sum to ~100%
  const weightSum = scores.reduce((sum, s) => sum + s.weight, 0);
  if (Math.abs(weightSum - 100) > 2) {
    warnings.push(`Score weights sum to ${weightSum}%, expected 100%.`);
  }

  // Check weighted total matches stated total
  if (totalScore !== null) {
    const computedTotal = scores.reduce((sum, s) => sum + (s.score * s.weight / 100), 0);
    const diff = Math.abs(computedTotal - totalScore);
    if (diff > 0.5) {
      warnings.push(`Stated total ${totalScore}/10 but computed weighted total is ${computedTotal.toFixed(2)}/10 (delta: ${diff.toFixed(2)}).`);
    }
  }
}

// Inject warning banner into HTML if needed
let validatedHtml = html;
if (warnings.length > 0) {
  const warningBanner = `
    <div style="margin: 16px 32px; padding: 12px 16px; background: ${COLORS.amber}15; border: 2px solid ${COLORS.amber}; border-radius: 6px;">
      <div style="font-weight: 700; font-size: 13px; color: ${COLORS.amber}; margin-bottom: 4px;">⚠️ Score Validation Warnings</div>
      ${warnings.map(w => `<div style="font-size: 12px; color: ${COLORS.body}; line-height: 1.4;">• ${escapeHtml(w)}</div>`).join("\n")}
    </div>`;
  // Insert after the assessment block, before the body sections
  validatedHtml = html.replace("<!-- Body -->", warningBanner + "\n    <!-- Body -->");
  console.warn("Score validation warnings:", warnings.join("; "));
}

const numberedHtml = validatedHtml;

const outputDir = path.dirname(outputPath);
if (outputDir && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, numberedHtml);
console.log(`Generated: ${outputPath} (${stage} mode)`);
