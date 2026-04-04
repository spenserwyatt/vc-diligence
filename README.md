# VC Deal Diligence Engine

Institutional-quality deal analysis powered by Claude Code. Drop a pitch deck and get a screening memo with scored dimensions, adversarial review, and an executive brief — the kind of output a senior associate at a top-tier fund would produce.

> **New here?** Follow the **[Step-by-Step Setup Guide](SETUP-GUIDE.md)** — it walks you through everything from scratch, no technical experience needed.

## Prerequisites

- **Node.js 18+** and npm
- **Python 3** with pip (for PDF text extraction)
- **Claude Code CLI** — [claude.ai/download](https://claude.ai/download) (requires a Claude subscription)

## Setup

```bash
git clone <repo-url> vc-diligence
cd vc-diligence
chmod +x setup.sh
./setup.sh
```

This installs everything: npm dependencies, Python packages (pymupdf, pyyaml), web UI, VoltAgent research subagents, Deep Research Skills, and Thinking Frameworks. If anything fails, the script tells you what to install manually.

## Web UI

The web interface lets you manage deals, trigger pipeline runs, review briefs, and take notes — no terminal required.

```bash
cd web
npm run dev
# Open http://localhost:3000
```

From the web UI you can:
- **Create deals** — upload pitch decks and fund materials
- **Run screening** — triggers the full analysis pipeline
- **Review briefs** — score breakdown, adversarial reviewer's take, dimension analysis
- **Add notes** — timestamped meeting notes, observations, action items
- **Ask questions** — Claude answers with the full memo as context
- **Export PDF** — print-ready brief for co-investors

## CLI Usage

You can also run everything from the terminal:

```bash
claude

# Drop a deck in deals/[company-name]/ and run:
> Run full diligence on the deck in deals/[company-name]/

# Or with just a company name:
> Run full diligence on [Company Name] — they're a [brief description]
```

Produces a screening memo (files 01-07), Word doc, and HTML executive brief.

### Stage 2: Deep Diligence (after data room access)
```bash
# Add data room materials to the deal folder:
# deals/[company-name]/data-room/financials.xlsx
# deals/[company-name]/data-room/distribution-agreement.pdf
# etc.

> Run deep diligence on deals/[company-name]/
# Or: "We have the data room for [company], upgrade to full diligence"
```

Builds on Stage 1 without redoing it. Produces files 08-09, updated Word doc, and updated HTML brief.

### Fund Evaluation
```bash
> Run fund diligence on the materials in deals/[fund-name]/

# Or:
> Evaluate [Fund Name] Fund II — climate-focused VC fund
```

### Quick Analysis (ad-hoc)
```bash
# Just the first-pass extraction and red flags:
> Use the deck-analyst to review the deck in deals/[company]/

# Just the terms:
> Use the terms-analyst to review the term sheet in deals/[company]/

# Just the financials:
> Use the financial-modeler to stress-test the projections in deals/[company]/

# Just the impact assessment:
> Use the impact-analyst to evaluate the impact thesis in deals/[company]/
```

## Project Structure
```
vc-diligence/
├── CLAUDE.md                          # Project context (Claude reads this first)
├── README.md                          # This file
├── .claude/
│   ├── skills/
│   │   ├── full-diligence.md          # Stage 1: Direct deal screening (auto-triggers)
│   │   ├── fund-diligence.md          # Stage 1: Fund evaluation screening (auto-triggers)
│   │   └── deep-diligence.md          # Stage 2: Post-data-room deep diligence
│   └── agents/
│       ├── deck-analyst.md            # Extracts and interrogates pitch claims
│       ├── market-researcher.md       # Validates market, maps competition, "Why Now?"
│       ├── team-researcher.md         # Background checks, gaps, red flags
│       ├── financial-modeler.md       # Stress-tests financials, scenario modeling
│       ├── terms-analyst.md           # Parses term sheets, flags non-standard
│       ├── impact-analyst.md          # Theory of change, additionality, measurement
│       ├── synthesis-agent.md         # Compiles final investment memo
│       └── adversarial-reviewer.md    # Pressure-tests the memo
├── deals/                             # Drop materials here (per-deal subfolders)
│   └── [company-name]/
│       ├── deck.pdf
│       ├── term-sheet.pdf
│       └── ...
├── scripts/
│   ├── generate-docx.js               # Markdown → Word document
│   └── generate-brief.js              # Markdown → HTML executive brief
├── output/                            # Generated deliverables
│   ├── [company-name]-diligence-memo.docx   # Stage 1 Word doc
│   ├── [company-name]-diligence-report.docx # Stage 2 Word doc
│   └── [company-name]-brief.html            # HTML executive brief
├── web/                               # Web UI (Next.js)
│   ├── src/app/                       # Pages and API routes
│   ├── src/components/                # React components
│   └── src/lib/                       # Data extraction and pipeline integration
└── templates/                         # Reference templates
```

## How the Pipeline Works

### Stage 1: Screening (auto-detected from startup materials)
```
Input → Deck Analyst (extract claims)
              ↓
         Market Researcher ─┐
         Competitive Analyst ├── Agent Team (parallel)
         Trend Analyst ──────┘
              ↓
         Team Researcher
              ↓
         Financial Modeler (marks estimates [ESTIMATED])
              ↓
         Terms Analyst (if term sheet exists)
              ↓
         Impact Analyst (if impact deal)
              ↓
         Synthesis Agent → Screening Memo (confidence annotations)
              ↓
         Adversarial Reviewer → Pressure Test
              ↓
         Word Doc + HTML Brief → output/
```

### Stage 2: Deep Diligence (triggered when data room added)
```
Verify Stage 1 (01-07) exists
              ↓
         Categorize data room files
              ↓
         Route to specialists:
           Financial docs → Financial Modeler
           Contracts      → Terms Analyst
           Certifications → Deck Analyst
           Customer data  → Market Researcher
           Cap table      → Terms Analyst
              ↓
         08-data-room-analysis.md
              ↓
         Synthesis Agent → Full Diligence Report
              ↓
         Adversarial Reviewer → Pressure Test
              ↓
         Word Doc + HTML Brief → output/
```

### Fund Evaluation (auto-detected from fund materials)
```
Input → P1: People (team-researcher)
         P2: Philosophy (synthesis-agent)
         P3: Process (research agents)
         P4: Portfolio (market-researcher + competitive-analyst)
         P5: Performance (financial-modeler)
              ↓
         Impact Analyst (if impact fund)
              ↓
         Synthesis Agent → Fund Memo
              ↓
         Adversarial Reviewer → Pressure Test
              ↓
         Word Doc + HTML Brief → output/
```

## Scoring Weights

### Direct Deals
| Dimension | Weight |
|-----------|--------|
| Team | 25% |
| Market | 25% |
| Product/Traction | 20% |
| Financial Viability | 15% |
| Terms | 10% |
| Risk-Adjusted | 5% |

### Impact Deals (modified)
Impact Integrity added at 10%, pulling proportionally from Market and Financial.

## Modeled After
- Sequoia Capital's investment memo process (YouTube memo, DoorDash memo)
- Bessemer Venture Partners' memo discipline ("Reasons NOT to Invest" section)
- a16z's rigorous internal evaluation framework
- Real investment memos from Lightspeed (Snapchat), Intel Capital (LinkedIn), Airbase (Series B)
