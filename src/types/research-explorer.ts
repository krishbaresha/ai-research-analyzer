export type ReadingMode = "beginner" | "researcher";

export type ExplorerEvidenceStatus =
  | "from_document"
  | "ai_interpretation"
  | "not_reported"
  | "not_established";

export interface ResearchIdentity {
  title: string;
  authors: string[];
  publicationYear?: string | number | null;
  journalOrConference?: string | null;
  doi?: string | null;
  arxivId?: string | null;
  openAccessStatus?: string | null;
  researchDomain?: string | null;
  pageCount: number;
  sourceType: string;
}

export interface ExecutiveResearchOverview {
  beginnerExplanation: string;
  beginnerAnalogy: string;
  technicalContribution: string;
  problemAddressed: string;
  whyItMatters: string;
  whatDiscovered: string;
  whoBenefits: string[];
}

export interface MetricCard {
  label: string;
  headline: string;
  detail: string;
  status: ExplorerEvidenceStatus;
  pageReferences: number[];
}

export interface ResearchAtAGlance {
  coreObjective: MetricCard;
  methodologyApproach: MetricCard;
  datasetOrSample: MetricCard;
  keyEmpiricalResult: MetricCard;
  computationalCost: MetricCard;
  primaryLimitations: MetricCard;
  reproducibilityStatus: MetricCard;
  ethicalStatus: MetricCard;
}

export interface ExplorerSectionItem {
  id: string;
  sectionNumber: number;
  title: string;
  cluster: "foundation" | "methodology" | "experiments" | "evaluation" | "impact";
  beginnerExplanation: string;
  researcherTechnical: string;
  evidenceStatus: ExplorerEvidenceStatus;
  pageReferences: number[];
  quote?: string | null;
  bulletPoints?: string[];
  keyValuePairs?: Array<{ key: string; value: string; page?: number | null }>;
}

export interface ChartDataPoint {
  category: string;
  value: number;
  isProposed?: boolean;
  baseline?: boolean;
}

export interface ChartSeries {
  seriesName: string;
  data: ChartDataPoint[];
}

export interface ReconstructedChart {
  id: string;
  title: string;
  chartType: "bar" | "line" | "comparison";
  xAxisLabel: string;
  yAxisLabel: string;
  unit: string;
  sourceTableOrSection: string;
  pageNumber: number;
  caption: string;
  data: ChartDataPoint[];
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  technicalNote?: string | null;
  pageReference?: number | null;
}

export interface WorkflowDiagram {
  id: string;
  title: string;
  diagramType: "pipeline" | "architecture" | "concept_map";
  caption: string;
  sourcePage: number;
  steps: WorkflowStep[];
}

export interface GlossaryTerm {
  term: string;
  plainDefinition: string;
  technicalDefinition: string;
  analogy?: string | null;
  pageReferences: number[];
}

export interface KeyCitation {
  citationText: string;
  relevance: string;
  isBaseline: boolean;
  pageReferences: number[];
}

export interface ResearchExplorerData {
  id: string;
  documentId: string;
  identity: ResearchIdentity;
  executiveOverview: ExecutiveResearchOverview;
  atAGlance: ResearchAtAGlance;
  sections: ExplorerSectionItem[];
  reconstructedCharts: ReconstructedChart[];
  workflowDiagrams: WorkflowDiagram[];
  glossary: GlossaryTerm[];
  keyCitations: KeyCitation[];
  modelId: string;
  generatedAt: string;
}
