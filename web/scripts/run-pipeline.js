#!/usr/bin/env node
/**
 * run-pipeline.js — Runs the diligence pipeline as a standalone process.
 * Spawned by the web server but fully detached from it.
 *
 * Usage: node web/scripts/run-pipeline.js <dealName> <pipelineType>
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEALS_DIR = path.join(PROJECT_ROOT, "deals");

const dealName = process.argv[2];
const pipelineType = process.argv[3] || "screening";

if (!dealName) {
  console.error("Usage: node run-pipeline.js <dealName> <pipelineType>");
  process.exit(1);
}

const dealDir = path.join(DEALS_DIR, dealName);
const statusPath = path.join(dealDir, "status.json");

// --- Kill zombie Claude processes before starting ---
try {
  const homeDir = require("os").homedir();
  const psOutput = execSync(
    `ps aux | grep "${homeDir}/.local/bin/claude" | grep -v grep | grep "stream-json" | awk '{print $2}'`,
    { encoding: "utf-8" }
  ).trim();
  if (psOutput) {
    const pids = psOutput.split("\n").filter(Boolean);
    if (pids.length > 0) {
      console.log(`Cleaning up ${pids.length} zombie Claude processes...`);
      execSync(`kill -9 ${pids.join(" ")}`, { stdio: "ignore" });
    }
  }
} catch {}

// --- Pre-extract PDF text ---
// Saves Claude from spending minutes parsing binary PDFs.
// Extracts text from all PDFs in the deal folder into .txt files.
const pdfs = fs.readdirSync(dealDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
if (pdfs.length > 0) {
  console.log(`Pre-extracting text from ${pdfs.length} PDF(s)...`);
  for (const pdf of pdfs) {
    const txtName = pdf.replace(/\.pdf$/i, ".extracted.txt");
    const txtPath = path.join(dealDir, txtName);
    if (fs.existsSync(txtPath)) {
      console.log(`  ${txtName} already exists, skipping.`);
      continue;
    }
    try {
      const { execFileSync } = require("child_process");
      const pdfPath = path.join(dealDir, pdf);
      execFileSync("python3", [
        path.join(__dirname, "extract-pdf.py"),
        pdfPath,
        txtPath,
      ], { stdio: "inherit", timeout: 30000 });
      console.log(`  Extracted: ${txtName}`);
    } catch (err) {
      console.error(`  Failed to extract ${pdf}: ${err.message}`);
    }
  }
}

// --- Phase file tracking ---
const DEAL_PHASE_FILES = [
  "01-extraction.md", "02-market.md", "03-team.md", "04-financials.md",
  "05-terms.md", "06-impact.md", "07-memo.md",
  "08-data-room-analysis.md", "09-full-report.md",
];

const FUND_PHASE_FILES = [
  "deck-extracted.md", "P1-people.md", "P2-philosophy.md",
  "P3-process.md", "P4-portfolio.md", "P5-performance.md", "fund-memo.md",
];

const PHASE_FILES = pipelineType === "fund" ? FUND_PHASE_FILES : DEAL_PHASE_FILES;

function writeStatus(updates) {
  try {
    let current = {};
    if (fs.existsSync(statusPath)) {
      current = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
    }
    fs.writeFileSync(statusPath, JSON.stringify({ ...current, ...updates }, null, 2));
  } catch (err) {
    console.error("Failed to write status:", err.message);
  }
}

function detectPhaseFromFiles() {
  try {
    const files = fs.readdirSync(dealDir);
    let latest = null;
    for (const pf of PHASE_FILES) {
      if (files.includes(pf)) latest = pf;
    }
    return latest;
  } catch {
    return null;
  }
}

// --- Main ---

const skillMap = {
  screening: "full-diligence",
  fund: "fund-diligence",
  deep: "deep-diligence",
};

const skill = skillMap[pipelineType] || "full-diligence";

// Tell Claude that pre-extracted text files are available
const extractedFiles = fs.readdirSync(dealDir).filter((f) => f.endsWith(".extracted.txt"));
const extractHint = extractedFiles.length > 0
  ? ` Pre-extracted text files are available (${extractedFiles.join(", ")}) — use these instead of reading PDFs directly for faster processing.`
  : "";

// Supplementary context from the web UI (e.g., founder call notes, updated info)
const supplementaryContext = process.env.PIPELINE_CONTEXT || "";
const contextBlock = supplementaryContext
  ? `\n\nAdditional context from the investor (incorporate this into your analysis):\n${supplementaryContext}`
  : "";

const prompt =
  pipelineType === "deep"
    ? `Run /${skill} on the deal in deals/${dealName}/. Data room files have been added.${extractHint}${contextBlock}`
    : `Run /${skill} on the deck in deals/${dealName}/.${extractHint}${contextBlock}`;

console.log(`Starting ${pipelineType} pipeline for ${dealName}...`);

const child = spawn(
  "claude",
  ["--print", "--dangerously-skip-permissions", prompt],
  {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  }
);

// Drain stdout/stderr to prevent backpressure
child.stdout.resume();
child.stderr.resume();

// Poll filesystem for progress every 5s
const dealLabels = {
  1: "Phase 1: Claim Extraction",
  2: "Phase 2: Market / Team / Financial (parallel)",
  3: "Phase 2: Market / Team / Financial (parallel)",
  4: "Phase 2: Market / Team / Financial (parallel)",
  5: "Phase 5: Terms Analysis",
  6: "Phase 6: Impact Analysis",
  7: "Phase 7: Synthesis & Review",
  8: "Phase 8: Data Room Analysis",
  9: "Phase 9: Full Report",
};

const fundLabels = {
  "deck-extracted.md": "Extraction",
  "P1-people.md": "P1: People Assessment",
  "P2-philosophy.md": "P2: Philosophy Assessment",
  "P3-process.md": "P3: Process Assessment",
  "P4-portfolio.md": "P4: Portfolio Assessment",
  "P5-performance.md": "P5: Performance Assessment",
  "fund-memo.md": "Synthesis & Review",
};

const poller = setInterval(() => {
  const latestFile = detectPhaseFromFiles();
  if (latestFile) {
    if (pipelineType === "fund") {
      writeStatus({ currentPhase: fundLabels[latestFile] || latestFile });
    } else {
      const phaseNum = parseInt(latestFile.split("-")[0], 10);
      writeStatus({ currentPhase: dealLabels[phaseNum] || `Phase ${phaseNum}` });
    }
  }
}, 5000);

child.on("close", (code) => {
  clearInterval(poller);

  if (code === 0) {
    console.log("Pipeline completed successfully.");
    writeStatus({
      state: "complete",
      currentPhase: null,
      completedAt: new Date().toISOString(),
    });

    // Generate deliverables
    let memoFile;
    if (pipelineType === "fund") {
      memoFile = `deals/${dealName}/fund-memo.md`;
    } else if (pipelineType === "deep") {
      memoFile = `deals/${dealName}/09-full-report.md`;
    } else {
      memoFile = `deals/${dealName}/07-memo.md`;
    }
    const stageArg = pipelineType === "deep" ? "full" : "screening";

    if (fs.existsSync(path.join(PROJECT_ROOT, memoFile))) {
      try {
        execSync(
          `node scripts/generate-brief.js "${memoFile}" "output/${dealName}-brief.html" ${stageArg}`,
          { cwd: PROJECT_ROOT, stdio: "inherit" }
        );
        console.log("Brief generated.");
      } catch (err) {
        console.error("Brief generation failed:", err.message);
      }

      try {
        execSync(
          `node scripts/generate-docx.js "${memoFile}" "output/${dealName}-diligence-memo.docx"`,
          { cwd: PROJECT_ROOT, stdio: "inherit" }
        );
        console.log("DOCX generated.");
      } catch (err) {
        console.error("DOCX generation failed:", err.message);
      }
    }
  } else {
    console.error(`Pipeline failed with exit code ${code}`);
    writeStatus({
      state: "failed",
      currentPhase: null,
      error: `Pipeline exited with code ${code}`,
      completedAt: new Date().toISOString(),
    });
  }
});

child.on("error", (err) => {
  clearInterval(poller);
  console.error("Failed to spawn claude:", err.message);
  writeStatus({
    state: "failed",
    currentPhase: null,
    error: err.message,
    completedAt: new Date().toISOString(),
  });
});
