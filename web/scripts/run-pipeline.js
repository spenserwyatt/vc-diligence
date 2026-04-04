#!/usr/bin/env node
/**
 * run-pipeline.js — Orchestrates the diligence pipeline with true parallel execution.
 * Instead of one Claude process running everything sequentially, this script
 * spawns separate Claude processes per phase and runs phases 2-4 in parallel.
 *
 * Usage: node web/scripts/run-pipeline.js <dealName> <pipelineType>
 */

const { spawn, execSync, execFileSync } = require("child_process");
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

const supplementaryContext = process.env.PIPELINE_CONTEXT || "";
const contextBlock = supplementaryContext
  ? `\n\nAdditional context from the investor (incorporate this into your analysis):\n${supplementaryContext}`
  : "";

// --- Helpers ---

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

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      ["--print", "--dangerously-skip-permissions", prompt],
      {
        cwd: PROJECT_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 500)}`));
    });
    child.on("error", reject);
  });
}

function preExtractPDFs() {
  const pdfs = fs.readdirSync(dealDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  for (const pdf of pdfs) {
    const txtName = pdf.replace(/\.pdf$/i, ".extracted.txt");
    const txtPath = path.join(dealDir, txtName);
    if (fs.existsSync(txtPath)) continue;
    try {
      execFileSync("python3", [
        path.join(__dirname, "extract-pdf.py"),
        path.join(dealDir, pdf),
        txtPath,
      ], { stdio: "inherit", timeout: 30000 });
      console.log(`  Extracted: ${txtName}`);
    } catch (err) {
      console.error(`  Failed to extract ${pdf}: ${err.message}`);
    }
  }
}

function getExtractHint() {
  const extracted = fs.readdirSync(dealDir).filter((f) => f.endsWith(".extracted.txt"));
  return extracted.length > 0
    ? ` Pre-extracted text files are available (${extracted.join(", ")}) — read these instead of PDFs.`
    : "";
}

function phaseExists(filename) {
  return fs.existsSync(path.join(dealDir, filename));
}

// --- Pipeline phases ---

async function phase1() {
  console.log("Phase 1: Claim Extraction...");
  writeStatus({ currentPhase: "Phase 1: Claim Extraction" });

  const hint = getExtractHint();
  await runClaude(
    `You are analyzing a deal in deals/${dealName}/.${hint}

Read the deck materials and use the deck-analyst agent to extract and categorize every claim. Identify what's missing, initial red flags, and the 3 most interesting and 3 most concerning things.

Save your complete output to deals/${dealName}/01-extraction.md${contextBlock}`
  );

  if (!phaseExists("01-extraction.md")) {
    throw new Error("Phase 1 failed — 01-extraction.md not created");
  }
  console.log("  Phase 1 complete.");
}

async function phase2_market() {
  console.log("  Phase 2: Market Interrogation...");
  await runClaude(
    `You are analyzing a deal in deals/${dealName}/. Read deals/${dealName}/01-extraction.md for the claim register.

Use the market-researcher agent to independently verify market sizing, map the competitive landscape, and assess "Why Now?". Reference claim IDs when verifying. Limit web searches to 8-10 total.

Save your complete output to deals/${dealName}/02-market.md`
  );
  console.log("  Phase 2 (market) complete.");
}

async function phase3_team() {
  console.log("  Phase 3: Team Assessment...");
  await runClaude(
    `You are analyzing a deal in deals/${dealName}/. Read deals/${dealName}/01-extraction.md for the claim register.

Use the team-researcher agent to research the founding team. Verify claimed backgrounds, assess execution capability, identify gaps. Limit web searches to 6-8 total.

Save your complete output to deals/${dealName}/03-team.md`
  );
  console.log("  Phase 3 (team) complete.");
}

async function phase4_financial() {
  console.log("  Phase 4: Financial Stress Test...");
  await runClaude(
    `You are analyzing a deal in deals/${dealName}/. Read deals/${dealName}/01-extraction.md for the claim register.

Use the financial-modeler agent to stress-test the financials. Build bear/base/bull scenarios, analyze unit economics, assess runway and valuation.

Save your complete output to deals/${dealName}/04-financials.md`
  );
  console.log("  Phase 4 (financial) complete.");
}

async function phase7_synthesis() {
  console.log("Phase 7a: Synthesis...");
  writeStatus({ currentPhase: "Phase 7: Synthesis & Review" });

  await runClaude(
    `You are analyzing a deal in deals/${dealName}/. Read the phase output files in deals/${dealName}/ (01-extraction.md, 02-market.md, 03-team.md, 04-financials.md, and 05-terms.md/06-impact.md if they exist).

Use the synthesis-agent to compile all findings into a single investment memo. Follow the synthesis-agent's structure exactly — Executive Summary, Why Now, Bull/Bear Case, Team, Market, Product, Financial, Risk Matrix, Deal Score, Recommendation.

Save your complete output to deals/${dealName}/07-memo.md`
  );

  if (!phaseExists("07-memo.md")) {
    throw new Error("Synthesis failed — 07-memo.md not created");
  }
  console.log("  Synthesis complete.");
}

async function phase7_adversarial() {
  console.log("Phase 7b: Adversarial Review...");
  writeStatus({ currentPhase: "Phase 7b: Adversarial Review" });

  await runClaude(
    `You are reviewing a deal in deals/${dealName}/. Read deals/${dealName}/07-memo.md.

Use the adversarial-reviewer agent to pressure-test the memo. Run the full adversarial process: assumption audit, weakest link analysis, pre-mortem, counter-thesis, and verdict with killer question.

IMPORTANT: Append your adversarial review as an appendix to the existing memo file deals/${dealName}/07-memo.md. Do not overwrite the memo — add your review after the existing content.`
  );
  console.log("  Adversarial review complete.");
}

function generateDeliverables() {
  const memoFile = `deals/${dealName}/07-memo.md`;
  if (!fs.existsSync(path.join(PROJECT_ROOT, memoFile))) return;

  try {
    execSync(
      `node scripts/generate-brief.js "${memoFile}" "output/${dealName}-brief.html" screening`,
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

// --- Main ---

async function main() {
  const startTime = Date.now();
  console.log(`Starting ${pipelineType} pipeline for ${dealName}...`);

  try {
    // Pre-extract PDFs
    preExtractPDFs();

    // Phase 1: Extraction (sequential — everything depends on this)
    await phase1();

    // Phases 2-4: Market, Team, Financial (TRUE PARALLEL)
    console.log("Phases 2-4: Running in parallel...");
    writeStatus({ currentPhase: "Phases 2-4: Market, Team, Financial (parallel)" });

    await Promise.all([
      phase2_market(),
      phase3_team(),
      phase4_financial(),
    ]);
    console.log("Phases 2-4 complete.");

    // Phase 7a: Synthesis
    await phase7_synthesis();

    // Phase 7b: Adversarial Review
    await phase7_adversarial();

    // Generate deliverables
    generateDeliverables();

    const elapsed = Math.round((Date.now() - startTime) / 60000);
    console.log(`Pipeline completed in ${elapsed} minutes.`);
    writeStatus({
      state: "complete",
      currentPhase: null,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Pipeline failed:", err.message);
    writeStatus({
      state: "failed",
      currentPhase: null,
      error: err.message,
      completedAt: new Date().toISOString(),
    });
  }
}

main();
