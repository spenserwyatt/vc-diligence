---
name: full-diligence
description: Use when asked to run diligence, analyze a deal, evaluate a startup, review a pitch deck, or assess a direct investment opportunity. Triggers on phrases like "run diligence," "analyze this deal," "what do you think of this company," "review this deck," "evaluate this investment." Do NOT use for fund/GP evaluation — use fund-diligence instead.
---

# Full Deal Diligence Pipeline

You are orchestrating a comprehensive deal analysis modeled after how Sequoia, Bessemer, and a16z evaluate investments internally. This is NOT a summary exercise. Every claim gets interrogated, every number stress-tested, every gap flagged.

## Step 0: Input Assessment

Read whatever materials have been provided (deck, term sheet, data room docs, or just a name).

**Performance optimization:** Check for `.extracted.txt` files in the deal folder — these are pre-extracted text from PDFs created by the pipeline runner. If available, read these instead of the raw PDFs. They contain the same content but are much faster to process.

Determine:
- What type of input is this? (deck, term sheet, data room, company name only)
- Is this an impact deal? (climate, social enterprise, ESG-thesis, SDG-aligned)
- Is there a term sheet present?
- What's missing that would strengthen the analysis?

**Investment stage classification — CRITICAL for scoring calibration:**

Determine the investment stage from the materials and state it explicitly. This drives how the scoring rubric is applied:

| Stage | Typical Signals | Return Bar |
|-------|----------------|------------|
| **Angel / Pre-Seed** | No or minimal revenue, SAFE/convertible note, <$3M raise, prototype/MVP, <10 employees | 50-100x on winners (expect 70-80% failure rate) |
| **Seed** | Early revenue or strong pilots, priced seed round, $2-5M raise, product in market, <25 employees | 20-30x on winners |
| **Series A** | $1-3M ARR, clear PMF signals, $5-15M raise, scaling team | 10-15x |
| **Series B+** | $5M+ ARR, proven unit economics, $15M+ raise, full team | 5-10x |
| **Growth / Late** | $20M+ ARR, profitable or near, $50M+ raise | 3-5x |

State the detected stage in your opening message: "This is an **[Angel/Seed/Series A/etc.]** deal." Pass this classification to all downstream agents — it changes how they evaluate the company.

**Stage classification:** This is a **Stage 1 Screening** analysis — pre-data room, based on pitch materials and independent research only. The output is a screening memo, not a full diligence report. A Stage 2 deep diligence can be run later when data room materials are available (see `deep-diligence` skill).

Then tell the user:
> "I have [what you have]. Running **Stage 1 Screening** across 7 phases. This produces a screening memo — not a final diligence report. When data room materials are available, run Stage 2 for the full report. I'll flag anything that requires additional materials."

If you only have a company name: run research-first using the web-search capabilities to gather baseline information before proceeding.

## Phase 1: Extraction & First Read
**Delegate to: deck-analyst subagent**

The deck-analyst extracts and categorizes every claim in the materials:
- Team claims (experience, prior exits, domain expertise)
- Market claims (TAM, SAM, SOM, growth rates)
- Traction claims (revenue, users, growth rate, retention)
- Financial claims (unit economics, margins, projections)
- Competitive claims (differentiation, moat, positioning)
- Technology claims (IP, defensibility, technical architecture)

It also identifies:
- What's NOT in the deck (the "dog that didn't bark")
- Initial red flags
- The 3 most interesting things and the 3 most concerning things

Save output to `deals/[company-name]/01-extraction.md`

## Phases 2-4: Market, Team, Financial — RUN IN PARALLEL

**CRITICAL: These three phases depend ONLY on Phase 1 output. Launch all three subagents simultaneously to save 15-20 minutes.**

Launch these three subagents at the same time using parallel tool calls:

### Phase 2: Market Interrogation
**Delegate to: market-researcher subagent**

The market-researcher handles all three dimensions — market sizing, competitive landscape, and "Why Now?" analysis — in a single comprehensive pass:

**Market Sizing:**
- Validate TAM/SAM/SOM — rebuild the market sizing bottom-up independently
- Flag whether the deck used top-down or bottom-up
- Search for independent market data, analyst reports, comparable market references
- Assess market maturity and growth trajectory

**Competitive Landscape:**
- Map the FULL competitive landscape, not just the 2x2 the deck shows
- Find competitors they didn't mention
- Assess moat strength and switching costs
- Evaluate barriers to entry

**"Why Now?" Analysis:**
- What structural tailwinds exist? (technology shifts, regulatory changes, demographic trends, behavioral changes)
- What macro/regulatory/technology shifts make this the right moment?
- What headwinds could kill it?
- Has anyone tried this before? If so, why did they fail and what's different now?
- Apply the Sequoia test: "If this solution were widely known and available, who would care and how much would it improve their lives?"

Returns findings with confidence ratings (high/medium/low) for each section.

Save output to `deals/[company-name]/02-market.md`

### Phase 3: Team Assessment
**Delegate to: team-researcher subagent**

Live research on founders and key team members:
- LinkedIn histories, prior companies, exits, failures
- Domain tenure — how long have they been in this specific space?
- Co-founder dynamics — how long working together, complementary or overlapping skills?
- Advisory board and investor quality — who's already backed this and what does that signal?
- Key hires assessment — do they have the right people for this stage?
- Gap analysis — what critical roles are missing?
- Red flags — prior lawsuits, controversies, resume inflation, pattern of short tenures

Save output to `deals/[company-name]/03-team.md`

### Phase 4: Financial Stress Test
**Delegate to: financial-modeler subagent**

Takes whatever financials exist and:
- Reconstructs unit economics from available data
- Builds three scenarios with explicit assumptions:
  - **Bear**: CAC doubles, churn 2x projected, sales cycle 50% longer, gross margin compresses 10pts
  - **Base**: Company hits 70% of their projections (the realistic case)
  - **Bull**: Company hits their projections and expansion revenue exceeds plan
- Calculates implied exit valuation at proposed terms — what does the company need to be worth for a 10x return? Is that realistic given comparables?
- Runway analysis — at current burn, when do they raise again? What milestones must they hit?
- Revenue quality assessment — recurring vs one-time, concentration risk, cohort analysis if available

Save output to `deals/[company-name]/04-financials.md`

**Wait for all three to complete before proceeding to Phase 5.**

## Phase 5: Terms Analysis
**Delegate to: terms-analyst subagent (if formal term sheet provided) OR skip if financial-modeler already covered terms**

**If a formal term sheet is provided:** Delegate to terms-analyst for detailed provision-by-provision analysis:
- Valuation relative to traction, stage, and sector comparables
- Liquidation preference structure (1x non-participating = standard; anything else = flag it)
- Anti-dilution provisions (weighted average vs full ratchet)
- Pro-rata rights, information rights, board composition
- Protective provisions and veto rights
- Option pool and its impact on effective valuation
- Pay-to-play, drag-along/tag-along provisions
- Cap table impact — what happens to founder ownership?
- Save output to `deals/[company-name]/05-terms.md`

**If NO formal term sheet:** Skip this phase — the financial-modeler (Phase 4) now includes a Deal Terms Assessment section that evaluates whatever deal economics are available from the deck (raise amount, implied valuation, instrument type) and recommends terms. This ensures terms evaluation always happens, even without a term sheet.

## Phase 6: Impact Analysis (ONLY if impact deal detected)
**Delegate to: impact-analyst subagent**

- Theory of change assessment — is the causal logic sound?
- Additionality — would this happen anyway without this capital?
- Measurement framework — IRIS+ aligned? Real KPIs or vanity metrics?
- Concessionary analysis — below-market returns expected? If so, is the impact justification sufficient?
- SDG alignment mapping
- Comparison to alternatives — could the same capital achieve more impact elsewhere?

Save output to `deals/[company-name]/06-impact.md`

## Phase 7: Synthesis & Adversarial Review
**Delegate to: synthesis-agent subagent, then adversarial-reviewer subagent**

**Step 1 — Synthesis Agent** compiles ALL upstream outputs into an investment memo:
1. Executive Summary (2 paragraphs — what this is and why it matters)
2. Why Now? (dedicated section — the structural case for timing)
3. The Bull Case (why this is interesting)
4. The Bear Case / Reasons NOT to Invest (every good memo has this)
5. Team Assessment (strengths, gaps, verdict)
6. Market Opportunity (size, dynamics, competitive position)
7. Product & Traction (what's built, what's working, defensibility)
8. Financial Analysis (scenarios, unit economics, runway)
9. Terms Assessment (if applicable)
10. Impact Assessment (if applicable)
11. Risk Matrix (scored by probability × severity)
12. Open Questions for Management (specific questions for the next meeting)
13. Deal Score (weighted matrix with scores 1-10 per dimension)
14. Recommendation: **Proceed** / **Pass** / **Need More Info**

**Step 2 — Adversarial Reviewer** receives the memo and attacks it:
- Challenges the weakest assumptions
- Points out where the analyst was too generous
- Identifies the single biggest risk that could kill this investment
- Provides a "pre-mortem": if this deal fails in 3 years, what's the most likely reason?
- Verdict: Does the thesis survive the pressure test?

The adversarial review is included as an appendix in the final memo.

Save final memo to `deals/[company-name]/07-memo.md`

## Final Output

Generate both Word document and HTML executive brief:

```bash
node scripts/generate-docx.js deals/[company-name]/07-memo.md output/[company-name]-diligence-memo.docx
node scripts/generate-brief.js deals/[company-name]/07-memo.md output/[company-name]-brief.html screening
```

The HTML brief is the primary "should we look deeper?" deliverable — a single-page visual summary with verdict, scores, claim heatmap, and top risks. The Word document contains the full screening memo for detailed review.

Both formatted for a family foundation board audience.
