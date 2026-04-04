// Client-safe types — no fs/path imports

export interface DealStatus {
  state: "idle" | "running" | "complete" | "failed";
  stage: 1 | 2 | null;
  currentPhase: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface DealMeta {
  source: string;        // Who referred this deal
  dateReceived: string;  // When the deal came in
  decisionDate: string;  // When the decision was made
  decisionBy: string;    // Who made the decision
  passReason: string;    // Categorical: valuation | team | market | terms | structural | timing | other
  nextReview: string;    // Date to revisit (for conditional proceed)
  notes: string;         // Free-form notes
  // Outcome tracking
  outcomeStatus: string;   // raised | operating | failed | acquired | unknown
  outcomeDate: string;     // When outcome was recorded
  outcomeValuation: string; // What valuation they raised at (if known)
  outcomeNotes: string;    // What actually happened
}

export interface DealFile {
  name: string;
  category: "source" | "pipeline" | "deliverable" | "dataroom";
  size: number;
  modified: string;
}

export interface DealSummary {
  name: string;
  displayName: string;
  verdict: { verdict: string; color: string } | null;
  totalScore: number | null;
  claimCounts: { verified: number; unverified: number; questionable: number };
  dealTerms: string | null;
  topRisk: string | null;
  thesis: string | null;
  weakestLink: string | null;
  meta: DealMeta;
  status: DealStatus;
  stage: "none" | "screening" | "deep";
  lastModified: string;
  hasHtmlBrief: boolean;
}

export interface DealDetail extends DealSummary {
  files: DealFile[];
  htmlBrief: string | null;
}
