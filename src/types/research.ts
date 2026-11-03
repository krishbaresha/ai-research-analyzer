/**
 * Evidence categorization tags enforcing truthful attribution.
 */
export type EvidenceLabel =
  | "from_document"      // Directly cited from uploaded document text with page reference
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

// ---------------------------------------------------------------------------
// Phase 4: Grounded Document Analysis Report Types
// ---------------------------------------------------------------------------

export interface ObjectiveItem {
  objective: string;
  pageReferences?: number[];
  evidenceSource: EvidenceLabel;
}

export interface DetailedSection {
  heading: string;
  content: string;
  pageReferences?: number[];
  evidenceSource: EvidenceLabel;
}

export interface MethodologyAssessment {
  approach: string;
  datasetsUsed: string[];
  baselines: string[];
  evaluationMetrics: string[];
  methodologicalRigor: string;
  pageReferences?: number[];
  evidenceSource: EvidenceLabel;
}

export interface ConceptItem {
  term: string;
  definition: string;
  pageReferences?: number[];
}

export interface DocumentAnalysisOverview {
  title: string;
  documentId: string;
  originalFilename: string;
  totalPages: number;
  analyzedPages: number[];
  coveragePercentage: number;
  isPartialCoverage: boolean;
  totalWordCount: number;
}

export interface DocumentAnalysisReport {
  id: string;
  documentId: string;
  overview: DocumentAnalysisOverview;
  executiveSummary: string;
  researchObjectives: ObjectiveItem[];
  keyFindings: FindingItem[];
  detailedAnalysis: DetailedSection[];
  methodologyAssessment: MethodologyAssessment;
  importantConcepts: ConceptItem[];
  strengths: string[];
  weaknesses: string[];
  limitations: string[];
  researchGaps: string[];
  conclusion: string;
  suggestedFurtherResearch: string[];
  modelId: string;
  generatedAt: string;
}
