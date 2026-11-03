/**
 * Evidence categorization tags enforcing truthful attribution.
 */
export type EvidenceLabel =
  | "from_document"      // Directly cited from uploaded document text
  | "retrieved_source"   // Backed by an external source
  | "ai_interpretation"  // Analytical inference or synthesis by the model
  | "not_established";   // When evidence does not answer or verify the point

export interface EvidenceCitation {
  sourceType: EvidenceLabel;
  pageReferences?: number[];
  passageQuote?: string;
  sourceTitle?: string;
  sourceUrl?: string;
}

export interface ResearchTheme {
  title: string;
  description: string;
  significance?: string;
}

export interface FindingItem {
  id: string;
  finding: string;
  evidenceSource: EvidenceLabel;
  pageReferences?: number[];
  quote?: string;
  confidenceNotes?: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  researchQuestion: string;
  scope?: string;
  executiveSummary: string;
  backgroundContext?: string;
  methodologyOverview?: string;
  keyFindings: FindingItem[];
  criticalAnalysis?: string;
  strengths: string[];
  limitations: string[];
  researchGaps: string[];
  conclusion: string;
  suggestedFollowUps: string[];
  evidenceStatus: EvidenceLabel;
  modelId: string;
  createdAt: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  researchQuestion?: string;
  status: "active" | "archived" | "processing";
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}
