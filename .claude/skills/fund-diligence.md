---
name: fund-diligence
description: Use when asked to evaluate a fund, assess a GP, review a fund deck or PPM, analyze a Limited Partnership Agreement, or conduct fund-level due diligence. Triggers on phrases like "evaluate this fund," "review this GP," "fund diligence," "assess this fund manager," "analyze this PPM." Do NOT use for direct startup deals — use full-diligence instead.
---

# Fund Diligence Pipeline (5P Framework)

You are conducting institutional-quality fund due diligence using the 5P framework: People, Philosophy, Process, Portfolio, Performance. This framework is used by sophisticated LPs, fund-of-funds, and family offices to evaluate fund managers.

## Step 0: Input Assessment

Read the fund materials provided (fund deck, PPM, LPA, track record data, or just a fund name).

Determine:
- What materials are available?
- What fund type? (VC, growth equity, impact fund, sector-specific)
- What vintage/fund number? (Fund I = different analysis than Fund III)
- Is this an impact fund? (triggers additional impact-specific analysis)

**Stage classification:** This is a **Stage 1 Screening** analysis — based on fund materials and independent research. The output is a screening memo. When additional GP materials or track record data become available, a deeper analysis can be conducted.

Then tell the user:
> "I have [what you have]. Running **Stage 1 Screening** via 5P fund diligence. This covers People, Philosophy, Process, Portfolio, and Performance."

## P1: People
**Delegate to: team-researcher subagent (configured for GP assessment)**

- GP backgrounds — investment track record, operational experience, domain expertise
- Team stability — turnover history, key person risk, succession planning
- Team composition — complementary skills, diversity of perspective, decision-making dynamics
- Alignment — GP commit size, carried interest structure, clawback provisions
- Network quality — LP base, co-investor relationships, portfolio company support capabilities
- Back-channel references — what does the market say about this GP? (web research)

Confidence rating per finding. Save to `deals/[fund-name]/P1-people.md`

## P2: Philosophy
**Delegate to: synthesis-agent subagent (configured for thesis analysis)**

- Investment thesis coherence — is the strategy clearly articulated and internally consistent?
- Thesis differentiation — what makes this fund's approach different from 50 other funds in the space?
- Market timing — why is this the right time for this strategy?
- Stage/sector focus — is it well-defined or scattered?
- Thesis evolution — how has the thesis changed across fund vintages? Is that evolution logical?
- Conviction assessment — do the actual investments match the stated thesis, or does the portfolio tell a different story?

Save to `deals/[fund-name]/P2-philosophy.md`

## P3: Process
**Delegate to: market-researcher subagent (configured for process assessment)**

- Deal sourcing — proprietary vs competitive, geographic reach, network-driven vs thesis-driven
- Evaluation methodology — what's their diligence process? How long? How many people involved?
- Decision-making — consensus vs conviction-based? Who has veto power?
- Portfolio construction — target number of investments, concentration, reserves strategy, follow-on approach
- Value-add model — what do they actually do post-investment? Is it real or marketing?
- Risk management — how do they handle troubled portfolio companies? Write-off discipline?

Save to `deals/[fund-name]/P3-process.md`

## P4: Portfolio
**Delegate to: market-researcher subagent**

- Holdings analysis — look up each portfolio company, assess quality and trajectory
- Sector concentration — is the portfolio diversified or concentrated? Is that intentional?
- Vintage diversification — deployment pace, are they investing on schedule?
- Outlier analysis — which investments have the best and worst trajectories? Why?
- Realized vs unrealized — how much of the return profile depends on unrealized markups?
- Follow-on reserves — adequate reserves for winners? Or spread too thin?

Save to `deals/[fund-name]/P4-portfolio.md`

## P5: Performance
**Delegate to: financial-modeler subagent (configured for fund performance)**

- Returns analysis — IRR, TVPI, DPI, RVPI across vintages
- Benchmark comparison — vs Cambridge Associates, Preqin, or relevant peer benchmarks
- Attribution — where did returns come from? One outlier or broad-based?
- Loss ratio — what percentage of investments went to zero or below 1x?
- Fee analysis — management fee, carry structure, fee offsets, organizational expenses
  - Calculate total fee drag over fund life
  - Compare fee structure to market standard for the strategy
  - Assess whether net-of-fee returns are competitive
- J-curve analysis — for newer funds, is the J-curve trajectory normal?
- Persistence — do prior fund returns predict future performance for this GP?

Save to `deals/[fund-name]/P5-performance.md`

## Synthesis

**Delegate to: synthesis-agent, then adversarial-reviewer**

Compile all 5P assessments into a single fund evaluation memo:

1. Executive Summary (2 paragraphs)
2. People Assessment (strengths, concerns, verdict)
3. Philosophy Assessment (thesis quality, differentiation, timing)
4. Process Assessment (sourcing, diligence, portfolio construction)
5. Portfolio Assessment (quality, concentration, trajectory)
6. Performance Assessment (returns, benchmarks, fees, attribution)
7. Impact Assessment (if applicable — additionality, measurement, intentionality)
8. Key Risks (ranked)
9. Open Questions for GP Meeting
10. Fund Score (using the 5P scoring rubric from the synthesis agent — score determines verdict mechanically)
11. Recommendation (determined by score: 7.0+ = COMMIT, 5.0-6.9 = CONDITIONAL COMMIT, <5.0 = PASS)

Adversarial reviewer then pressure-tests the recommendation and produces adjusted scores. The adjusted score is the final score. Include as appendix.

Generate Word document and HTML executive brief:
```bash
node scripts/generate-docx.js deals/[fund-name]/fund-memo.md output/[fund-name]-fund-diligence.docx
node scripts/generate-brief.js deals/[fund-name]/fund-memo.md output/[fund-name]-brief.html screening
```
