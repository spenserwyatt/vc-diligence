# Example Deal Folder Structure

Drop your materials in a folder named after the company or fund, then run diligence.

## Direct Deal (Startup)

```
deals/acme-corp/
  pitch-deck.pdf          # Required — the primary input
  term-sheet.pdf          # Optional — triggers Phase 5 (Terms Analysis)
  financials.xlsx         # Optional — strengthens Phase 4 (Financial Stress Test)
  data-room/              # Optional — for Stage 2 deep diligence
    audited-financials.pdf
    distribution-agreement.pdf
    customer-list.csv
    cohort-analysis.pdf
    cap-table.xlsx
    ul-certification.pdf
```

**Stage 1 (Screening):** `Run full diligence on deals/acme-corp/`
**Stage 2 (Deep Diligence):** Add files to `data-room/`, then: `Run deep diligence on deals/acme-corp/`

**Impact detection:** If the deck mentions climate, social impact, ESG, SDGs, or an explicit impact thesis, Phase 6 (Impact Analysis) runs automatically.

## Fund Evaluation

```
deals/greenfield-fund-iii/
  fund-deck.pdf           # Required — GP presentation
  ppm.pdf                 # Optional — Private Placement Memorandum
  lpa-summary.pdf         # Optional — LP Agreement or summary of terms
  track-record.xlsx       # Optional — historical fund performance data
```

**Trigger:** `Evaluate the fund in deals/greenfield-fund-iii/`

## Pipeline Output Files

### Stage 1: Screening

```
deals/acme-corp/
  01-extraction.md        # Phase 1: Claim extraction from deck
  02-market.md            # Phase 2: Market sizing, competition, Why Now?
  03-team.md              # Phase 3: Founder/team assessment
  04-financials.md        # Phase 4: Bear/base/bull scenarios (marked [ESTIMATED])
  05-terms.md             # Phase 5: Term sheet analysis (if provided)
  06-impact.md            # Phase 6: Impact assessment (if impact deal)
  07-memo.md              # Phase 7: Screening memo + adversarial review
```

### Stage 2: Deep Diligence (after data room)

```
deals/acme-corp/
  08-data-room-analysis.md  # Phase 8: Data room findings, claim updates
  09-full-report.md         # Phase 9: Full diligence report + adversarial review
```

Stage 1 files (01-07) are preserved as audit trail — Stage 2 does NOT overwrite them.

### Fund Evaluations (5P naming)

```
deals/greenfield-fund-iii/
  P1-people.md
  P2-philosophy.md
  P3-process.md
  P4-portfolio.md
  P5-performance.md
  fund-memo.md            # Final compiled memo
```

### Deliverables in output/

```
output/acme-corp-diligence-memo.docx       # Stage 1 Word doc
output/acme-corp-diligence-report.docx     # Stage 2 Word doc
output/acme-corp-brief.html                # HTML executive brief (regenerated each stage)
output/greenfield-fund-iii-fund-diligence.docx
output/greenfield-fund-iii-brief.html
```

## File Naming

- Use lowercase with hyphens for folder names: `deals/acme-corp/`, not `deals/Acme Corp/`
- The system uses the folder name for all output file naming
- Claim IDs (C1, C2, C3...) are assigned in Phase 1 and tracked through the pipeline
