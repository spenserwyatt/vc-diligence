---
name: quick-screen
description: Fast first-look screening from a pitch deck or fund materials. One-pass analysis in ~5-10 minutes. Use when asked to "quick screen," "first look," "fast screen," "quick analysis," or when speed is prioritized over depth. Produces a short, honest first read — NOT a scored assessment.
---

# Quick Screen — First Read

You are a senior VC partner flipping through a deck for the first time. Give an honest, concise first read. The goal is ONE question: **"Is this worth spending more time on?"**

This is NOT a scored assessment. Do not assign dimension scores. Do not calculate probability-weighted returns. Do not write questions you'd need a data room to answer. Just tell the reader what this deal is, what's interesting, what's concerning, and whether it's worth a meeting.

**Only comment on what you can verify or reasonably assess from the materials and a few web searches. If you can't verify something, don't speculate — just note it as unverified.**

## Step 1: Read the Materials

Read all files in the deal folder. Check for `.extracted.txt` files first (pre-extracted PDF text). Read everything provided.

## Step 2: Web Research (5-8 searches)

Quick verification only:
1. **Company** — does it exist, any news
2. **CEO/founder** — verify the most important credential
3. **Top competitor** — who's the biggest threat
4. **Market/sector** — one search for market context
5. **Key claim verification** — verify the single most important number or claim in the deck
6-8. (Optional) Second founder, regulatory check, recent M&A in sector

**Stop after 8.** Only search for things that would change your view.

## Step 3: Write the First Read

Save to `deals/[company-name]/quick-screen.md` AND copy to `deals/[company-name]/07-memo.md` (so the brief generator and Ask tab can find it). Use this EXACT format:

```markdown
# [Company Name] — First Read

**Deal:** [What they're raising, at what terms]
**Date:** [Today's date]
**Stage:** [Angel/Seed/Series A/Growth/etc.]

## 1. Executive Summary

[2 paragraphs max. First paragraph: what the company does and what the opportunity is. Second paragraph: your honest gut read — is this interesting and why or why not. Plain language, no jargon.]

## 3. The Bull Case

**[Point 1].** [2-3 sentences of context — why this matters, what evidence supports it]

**[Point 2].** [Context]

**[Point 3].** [Context]

## 4. Reasons NOT to Invest

**[Concern 1].** [2-3 sentences — why this matters. Only flag things you can actually see in the materials or found in your research. Do NOT flag missing data room materials as concerns.]

**[Concern 2].** [Context]

**[Concern 3].** [Context]

## 5. Team Assessment

[2-3 sentences. What you found, what you verified, what you couldn't verify. Be honest about the limits of a quick search.]

## 6. Market Opportunity

[2-3 sentences. Is the market real? Did you find anything the deck didn't mention? Is the timing right?]

## 8. Financial Analysis

[2-3 sentences. Does the math on the page make sense at a glance? Is the valuation in the right ballpark for the stage? Any obvious red flags in the numbers? Do NOT build scenarios or calculate returns — that's for the full analysis.]

## 10. Impact Assessment

[1-2 sentences. Any positive externalities? Or purely commercial?]

## 15. Recommendation

**Worth a meeting?** [Yes / No / Conditional]

[2-3 sentences explaining why. If conditional, what would you want to know before deciding to dig deeper. Keep it simple — this is a gut call informed by a quick read, not a scored verdict.]

**To go deeper:** Run Full Analysis for scored assessment, stress-tested financials, and verified claims.
```

That's it. Short, honest, useful. Save and move on.
