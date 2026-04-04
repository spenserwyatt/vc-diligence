---
name: deep-diligence
description: Use when data room materials are available and a Stage 1 screening has already been completed. Triggers on phrases like "run deep diligence," "data room analysis," "stage 2," "upgrade to full diligence," "we have the data room." Requires existing Stage 1 outputs (01-07) in the deal folder.
---

# Stage 2: Deep Diligence Pipeline

You are upgrading a Stage 1 screening into a full diligence report. The screening memo already exists — this pipeline incorporates data room materials to verify claims, update financials, and produce a definitive investment recommendation.

**This pipeline does NOT redo web research, team backgrounds, or market sizing** unless data room materials materially change those assessments. It focuses on: upgrading claim verification, incorporating real financials, reflecting contract findings, and updating the risk matrix.

## Step 0: Validation & Inventory

Read the deal folder at `deals/[company-name]/`.

**Verify Stage 1 outputs exist:**
- `01-extraction.md` — claim extraction
- `02-market.md` — market analysis
- `03-team.md` — team assessment
- `04-financials.md` — financial stress test
- `07-memo.md` — screening memo

If any of 01, 02, 03, 04, or 07 are missing, STOP and tell the user:
> "Stage 1 screening is incomplete. Run `full-diligence` first, then add data room materials."

**Identify new files** — anything in the deal folder that is NOT a numbered .md file or the original deck:
- Look in the deal folder root and in `deals/[company-name]/data-room/` if it exists
- Categorize each file by type:
  - **Financial docs**: P&L, balance sheet, cash flow, bank statements, tax returns → route to financial-modeler
  - **Contracts/agreements**: distribution agreements, LOIs, MOUs, customer contracts, supplier agreements → route to terms-analyst
  - **Certifications/technical**: UL listings, AHRI certs, patents, technical specs, test reports → route to deck-analyst
  - **Customer data/pipeline**: customer list, pipeline tracker, CRM export, cohort data → route to market-researcher
  - **Cap table/corporate**: cap table, articles of incorporation, board minutes, prior round docs → route to terms-analyst

Tell the user what was found:
> "Found Stage 1 outputs (01-07). Identified [N] new data room files:
> - [filename] → [category] → [agent]
> - ...
> Running Phase 8: Data Room Analysis."

## Phase 8: Data Room Analysis

**Delegate to specialist agents by document type.** Each agent receives:
1. The relevant data room documents
2. Their own Stage 1 output as baseline
3. The claim IDs from `01-extraction.md` that relate to their domain

### Financial Documents → financial-modeler subagent

The financial-modeler reads `04-financials.md` (its Stage 1 output) as baseline, then analyzes the actual financial documents. Instructions:

- Compare reconstructed [ESTIMATED] figures against actual audited/reviewed numbers
- Note every delta: "Stage 1 estimated gross margin at 20%; actual audited gross margin is 34%"
- Rebuild scenario models with real inputs
- Update exit math and runway analysis
- Reference claim IDs when verifying or contradicting financial claims
- Update claim statuses with evidence from documents

### Contracts/Agreements → terms-analyst subagent

The terms-analyst reads `01-extraction.md` for contract-related claims and `05-terms.md` (if exists) as baseline. Instructions:

- Analyze distribution agreements, exclusivity terms, termination clauses
- Verify contract claims from the deck against actual agreement language
- Flag any provisions that materially change the risk profile
- Assess customer contracts: binding vs non-binding, duration, value
- Reference claim IDs when verifying contract claims

### Certifications/Technical → deck-analyst subagent

The deck-analyst reads `01-extraction.md` as baseline. Instructions:

- Verify technology claims against actual certifications and test reports
- Check patent ownership, scope, and expiration
- Assess technical specifications vs deck claims
- Update claim statuses for all technology/product claims

### Customer Data/Pipeline → market-researcher subagent

The market-researcher reads `02-market.md` as baseline. Instructions:

- Validate pipeline claims against actual CRM data or customer list
- Assess customer concentration risk
- Verify retention/churn claims against cohort data
- Update market positioning assessment if customer data reveals new information
- Reference claim IDs for traction claims

### Cap Table/Corporate → terms-analyst subagent

The terms-analyst handles cap table and corporate docs alongside contracts.

### Output Format

Each agent produces structured output. Combine all agent outputs into `deals/[company-name]/08-data-room-analysis.md` with:

1. **Claim Status Updates** — table of every claim ID whose status changed:

| Claim ID | Stage 1 Status | Stage 2 Status | Evidence |
|----------|---------------|----------------|----------|

2. **Financial Reconciliation** — Stage 1 estimates vs actual numbers:

| Metric | Stage 1 Estimate | Actual (Data Room) | Delta |
|--------|-----------------|-------------------|-------|

3. **Contract Analysis** — key findings from agreements
4. **Certification Status** — verified vs missing certifications
5. **New Information** — material facts not in the pitch deck
6. **Revised Risk Assessment** — which Stage 1 risks are confirmed, mitigated, or new

Save to `deals/[company-name]/08-data-room-analysis.md`

## Phase 9: Full Report Synthesis

**Delegate to: synthesis-agent subagent (in full diligence mode), then adversarial-reviewer subagent**

The synthesis-agent reads ALL files:
- `01-extraction.md` through `07-memo.md` (Stage 1 outputs)
- `08-data-room-analysis.md` (Stage 2 findings)

Instructions to synthesis-agent:
- Set mode to **full diligence** (title: "DILIGENCE REPORT — Post-Data Room Analysis")
- Do NOT redo analysis that hasn't changed — reference Stage 1 sections that remain valid
- Focus updates on:
  - Upgraded claim statuses based on 08 findings
  - Revised financial analysis with real numbers
  - Contract findings that change risk profile
  - Updated Risk Matrix scores
  - Potentially changed recommendation
- The "What We Know vs What We're Estimating" section should show significantly more in the "Known" column
- Remove or reduce the "Data Room Requirements" section (satisfied items noted)
- Confidence comments should reflect higher certainty where data room evidence exists

**Adversarial reviewer** pressure-tests the full report with the same rigor as Stage 1, but with additional focus on:
- Did the data room materials actually resolve Stage 1 uncertainties?
- Are there new risks revealed by the data room that weren't anticipated?
- Is the recommendation change (if any) adequately supported by evidence?

Save to `deals/[company-name]/09-full-report.md`

## Final Output

Generate both deliverables:

```bash
node scripts/generate-docx.js deals/[company-name]/09-full-report.md output/[company-name]-diligence-report.docx
node scripts/generate-brief.js deals/[company-name]/09-full-report.md output/[company-name]-brief.html full
```

**File naming — Stage 2 does NOT overwrite Stage 1:**
- `08-data-room-analysis.md` — new evidence from data room
- `09-full-report.md` — the upgraded definitive memo
- Stage 1 files (01-07) preserved as audit trail

Tell the user:
> "Stage 2 complete. Full diligence report at `output/[company-name]-diligence-report.docx`. Executive brief at `output/[company-name]-brief.html`. Stage 1 screening preserved in files 01-07."
