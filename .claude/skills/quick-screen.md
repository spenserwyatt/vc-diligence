---
name: quick-screen
description: Fast first-look screening from a pitch deck or fund materials. One-pass analysis in ~10-15 minutes. Use when asked to "quick screen," "first look," "fast screen," "quick analysis," or when speed is prioritized over depth. Produces the same brief format as full-diligence but in a single Claude call.
---

# Quick Screen — One-Pass Deal Screening

You are a senior VC partner doing a fast first read of deal materials. The goal is to answer ONE question: **"Is this worth a meeting and a data room request?"** — NOT "should we invest?"

This is a single-pass analysis. You read the materials, do a handful of targeted web searches, and write the screening memo directly. No intermediate files, no multi-agent pipeline.

## Step 1: Read the Materials

Read all files in the deal folder. Check for `.extracted.txt` files first (pre-extracted PDF text — faster to process). Read the deck, any PPM/offering memo, and any other materials provided.

As you read, note:
- What they do, what they're asking for (amount, valuation, instrument)
- Team — who are the key people
- Key claims about market, traction, financials, competition
- What's NOT in the materials (deliberate omissions vs expected-missing at this stage)
- Anything that looks wrong or inflated

## Step 2: Targeted Web Research (8-10 searches)

Do these searches:
1. **Company name** — does it exist, any recent news, any red flags
2. **CEO/founder name** — LinkedIn background, prior companies, verify the MOST important claimed credential
3. **Second key team member** — verify background of CTO/COO/key hire
4. **Top competitor** — who is the biggest threat they may not have mentioned
5. **Market size** — industry TAM/growth data in their sector
6. **Product/tech verification** — confirm the technology or product is real
7. **Regulatory/tariff/policy** — verify any regulatory claims in the deck (tariff rates, compliance requirements, government programs)
8. **Verify the single most important number in the deck** — whatever claim the entire thesis rests on (revenue figure, market share, exit comp, cost structure), search for independent confirmation

**Optional (9-10):**
9. **Second competitor or adjacent threat**
10. **Recent M&A or funding in the sector**

**Stop after 10 searches.** This is a quick screen, not deep research. But the 8 core searches are non-negotiable — the quality difference between 5 and 8 searches is enormous.

## Step 3: Write the Screening Memo

Write a single markdown file following this EXACT structure. The section headings must match exactly — they are used by the brief generator.

**Remember the screening mindset:**
- Missing data room materials (audited financials, investor lists, contracts) are EXPECTED — note as "needed for next step," not red flags
- Deliberately omitted information (revenue from operating business, competitive landscape) IS worth flagging
- Cite sources for any specific numbers or market standards you reference
- Score fairly — a deal can score well on some dimensions even if others are weak

```markdown
# SCREENING MEMO — Pre-Data Room Analysis
# [Company Name]

**Deal:** [Amount] at [valuation/terms]
**Date:** [Today's date]
**Stage:** [Angel/Seed/Series A/etc.]

## 1. Executive Summary

[Paragraph 1: What this company does, what they're raising, the core thesis — plain language]

[Paragraph 2: Your bottom line assessment. What's interesting, what's concerning, and whether this is worth pursuing further. Be specific and direct.]

## 3. The Bull Case

**[Strength 1 — bold headline].** [2-3 sentence explanation with evidence and context]

**[Strength 2].** [Explanation]

**[Strength 3].** [Explanation]

[3-5 items total. Each must have real substance, not just a label.]

## 4. Reasons NOT to Invest

**[Concern 1 — bold headline].** [2-3 sentence explanation with specific evidence]

**[Concern 2].** [Explanation]

**[Concern 3].** [Explanation]

[3-5 items total. Distinguish between real red flags and things that are just expected-missing at screening stage.]

## 5. Team Assessment

[1-2 paragraphs. What you found about the team from the deck + web search. Strengths, gaps, any verification issues. Be specific about what you verified vs couldn't verify.]

## 6. Market Opportunity

[1-2 paragraphs. Your quick take on market size, competition, and timing. Reference your web search findings. If the deck's TAM looks wrong, say why and give your estimate with source.]

## 8. Financial Analysis

[1-2 paragraphs on whether the deck's numbers hold up. Then a simple scenario table:]

| Scenario | Probability | Key Assumption | Revenue/EBITDA | Implied Return |
|----------|------------|----------------|---------------|----------------|
| Bear | [X]% | [What goes wrong] | [Numbers] | [X.Xx MOIC] |
| Base | [X]% | [Realistic case — 70% of plan] | [Numbers] | [X.Xx MOIC] |
| Bull | [X]% | [Management's plan works] | [Numbers] | [X.Xx MOIC] |

**Probability-weighted return: [show the math: (bear% × bear MOIC) + (base% × base MOIC) + (bull% × bull MOIC) = X.Xx]**

[Compare to stage-appropriate return bar. Does the deal clear it? Mark all reconstructed numbers as [ESTIMATED].]

## 10. Impact Assessment

[1-2 sentences. Does this deal have positive externalities (environmental, health, social)? If it's a formal impact deal, note the thesis. If purely commercial, note any incidental positive impact.]

## 12. Open Questions for Management

1. **[Topic]:** [Full question with context — explain WHY you're asking and WHAT you'd be looking for in the answer]

2. **[Topic]:** [Full question with context]

[5-7 questions. Each should be specific enough to bring to a meeting. Include the "why this matters" for each.]

## 14. Deal Score

| Dimension | Weight | Score (1-10) | Rationale |
|-----------|--------|-------------|-----------|
| Team | 25% | [X] | [One sentence] |
| Market | 25% | [X] | [One sentence] |
| Product/Traction | 20% | [X] | [One sentence] |
| Financial Viability | 15% | [X] | [One sentence] |
| Terms & Valuation | 15% | [X] | [One sentence] |
| **TOTAL** | **100%** | **[weighted avg]/10** | |

## 15. Recommendation

[Verdict paragraph — is this worth pursuing further? Under what conditions?]

**What would make this worth pursuing further:**

1. **[Condition].** [What you'd want to see and why]
2. **[Condition].** [What you'd want to see and why]
[3-5 conditions with explanations]

# ADVERSARIAL REVIEW

[Write this section yourself — you are both the analyst and the reviewer in quick screen mode. Be rigorous.]

## 1. Top 3 Assumptions Tested

For each, state the assumption, rate fragility (HIGH/MEDIUM/LOW), and explain what breaks if it's wrong:

1. **[Assumption]** — Fragility: [X]. [What happens if wrong]
2. **[Assumption]** — Fragility: [X]. [What happens if wrong]
3. **[Assumption]** — Fragility: [X]. [What happens if wrong]

## 2. Weakest Link

[The single weakest element of the thesis. One paragraph. If two risks are correlated (could happen together), flag the joint probability.]

## 4. Pre-Mortem

**It is [3 years from now]. This investment has failed. Here is what happened:**

[One paragraph — a specific, plausible failure narrative. Not generic "things didn't work out." Name the specific events, timeline, and outcome for investors.]

**Most likely cause of death:** [One sentence]

## 6. Verdict

**Does the thesis survive?** [Yes/Partially/No — with 1-2 sentence explanation]

**Biggest risk the analysis underweights:** [One sentence]

**If you could ask the founders one question:**

*"[A specific, evidence-based question that gets at the core uncertainty. Not open-ended — something that has a concrete, verifiable answer that would change your view. Reference specific numbers or claims from the deck.]"*

**Confidence:** [Level + one sentence on what drives uncertainty]
```

## Step 4: Save the Output

Save the completed memo to `deals/[company-name]/07-memo.md`

That's it. One file, one pass, done.
