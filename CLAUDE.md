# VC Deal Diligence Engine

## What This Is
A comprehensive venture capital analysis and due diligence system modeled after how Sequoia, Bessemer, and a16z actually evaluate deals internally. When given a pitch deck, fund memo, term sheet, or even just a company name, it produces institutional-quality diligence output — the kind a senior associate at a top-tier fund would write.

The owner evaluates both traditional VC deals and impact investments for a family foundation. Deals range from climate-focused VC funds to defense tech SPVs to direct startup investments.

## Core Principle
**Never summarize — analyze.** Every claim gets interrogated. Every number gets stress-tested. Every gap gets flagged. The output should read like it came from Sequoia's deal team, not a book report. As a16z's internal guidance says: "Don't just regurgitate the pitch deck. Provide your own insights."

## Project Structure
```
/deals/           — Drop decks, term sheets, data room files here (per-deal subfolders)
/output/          — Generated memos and analysis (Word docs)
/templates/       — Reference templates for output formats
/.claude/skills/  — Analysis skills (auto-invoked by topic)
/.claude/agents/  — Specialist subagents (delegated to by orchestrator)
```

## How It Works

### Input Detection & Routing
The system auto-detects what you've provided and routes accordingly:
- **Pitch deck / startup materials** → Direct Deal Pipeline (7 phases)
- **Fund deck / PPM / LPA / GP materials** → Fund Diligence Pipeline (5P framework)
- **Term sheet only** → Terms Analyst directly
- **Company or fund name only** → Research-first mode (gather info, then run pipeline)

### Two-Stage Pipeline

The system operates in two stages:

**Stage 1: Screening** (pre-data room) — produces a screening memo based on pitch materials and independent research. This is the default when running `full-diligence` or `fund-diligence`. Output: files 01-07 + HTML executive brief.

**Stage 2: Deep Diligence** (post-data room) — triggered via `deep-diligence` skill when data room materials are added to the deal folder. Builds on Stage 1 without redoing it. Output: files 08-09 + updated HTML brief.

### Direct Deal Pipeline — Stage 1 (7 Phases)
1. Deck Analyst — extracts key facts, identifies gaps and red flags
2. Market Interrogation — validates TAM/SAM, maps competition, answers "Why Now?" (market-researcher handles all three)
3. Team Assessment — backgrounds, track record, gaps, red flags
4. Financial Stress Test — bear/base/bull scenarios, unit economics (marked [ESTIMATED] without data room)
5. Terms Analysis — parses provisions, flags non-standard terms (if term sheet provided)
6. Impact Analysis — theory of change, additionality, measurement (if impact deal)
7. Synthesis & Adversarial Review — produces screening memo with confidence annotations, then pressure-tests it

### Direct Deal Pipeline — Stage 2 (Phases 8-9)
8. Data Room Analysis — routes documents to specialist agents, updates claim statuses with hard evidence
9. Full Report Synthesis — upgrades screening memo to definitive diligence report

### Fund Diligence Pipeline (5P Framework)
1. People — GP backgrounds, track record, team stability, succession
2. Philosophy — thesis coherence, differentiation, market timing
3. Process — sourcing, evaluation, decision-making, portfolio construction
4. Portfolio — holdings analysis, sector concentration, vintage diversification
5. Performance — returns vs benchmarks, attribution, loss ratios, fee analysis

### Token Efficiency Rules
- Research/extraction agents use model: sonnet (fast, cheap)
- Synthesis and adversarial review use model: opus (need reasoning depth)
- Financial modeling uses model: opus (scenario analysis needs depth)
- Each agent works in its own context — no context pollution between phases
- Agents return structured summaries, not raw dumps

## Output Standards
- Every deck claim tagged: ✅ Verified | ⚠️ Unverified | 🚩 Questionable
- Financial projections include bear/base/bull scenarios with explicit assumptions
- Market sizing distinguishes top-down vs bottom-up, rebuilds independently
- "Why Now?" gets its own dedicated section — the Sequoia test
- "Reasons NOT to Invest" section required — the Bessemer discipline
- Team assessment identifies gaps, not just summarizes bios
- Deal scoring uses calibrated weighted matrix: Team 30%, Market 25%, Product/Traction 25%, Financial Viability 10%, Terms & Valuation 10%
- Score determines verdict mechanically: 7.0+ = PROCEED, 5.0-6.9 = CONDITIONAL PROCEED, <5.0 = PASS. No narrative override.
- Adversarial reviewer produces explicit score adjustments — the adjusted score is the final score
- Impact deals add Impact Integrity at 10%, pulling from Market and Product/Traction
- Open Questions for Management section always included
- Final output includes both a Word doc (.docx) via `node scripts/generate-docx.js` and an HTML executive brief via `node scripts/generate-brief.js`, formatted for a family/board audience
- The HTML brief is the primary "should we look deeper?" deliverable — a single-page visual summary with verdict, scores, claim heatmap, and top risks

## Dependencies
Run `./setup.sh` to install everything automatically. This installs:
- docx npm package for Word doc generation
- VoltAgent subagents: research-analyst, competitive-analyst, trend-analyst, data-researcher (to ~/.claude/agents/)
- Deep Research Skills: web-search-agent and research skills (to ~/.claude/skills/ and ~/.claude/agents/)
- Thinking Frameworks: decision-matrix, research-claim-map, bayesian-reasoning-calibration (to ~/.claude/skills/)

### Third-Party Agent Usage
- VoltAgent agents are prefixed `voltagent-` to avoid conflicts with project agents
- The project's custom agents (in .claude/agents/) take priority for deal analysis
- **VoltAgent agents (competitive-analyst, trend-analyst, research-analyst) are supplemental, not required for the core pipeline** — the project's market-researcher agent covers competitive landscape, trend analysis, and market sizing comprehensively
- Deep Research agents provide additional web search capability
- Thinking Framework skills (decision-matrix, research-claim-map) can be invoked for scoring and claim verification

### File Naming Convention (Two-Stage)
- Stage 1: `01-extraction.md` through `07-memo.md` (screening)
- Stage 2: `08-data-room-analysis.md`, `09-full-report.md` (deep diligence)
- Stage 2 does NOT overwrite Stage 1 — files 01-07 are preserved as audit trail
- HTML briefs: `output/[name]-brief.html` (regenerated at each stage)
- Word docs: `output/[name]-diligence-memo.docx` (Stage 1), `output/[name]-diligence-report.docx` (Stage 2)



<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>