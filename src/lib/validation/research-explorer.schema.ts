import { z } from "zod";
import { pageReferencesCoerce, stringArrayCoerce } from "./research.schema";

export const explorerEvidenceStatusSchema = z.preprocess((val: unknown) => {
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    if (s.includes("document") || s.includes("empirical") || s.includes("fact") || s.includes("verif") || s.includes("found")) return "from_document";
    if (s.includes("ai") || s.includes("interpret") || s.includes("eval") || s.includes("synthes") || s.includes("model")) return "ai_interpretation";
    if (s.includes("not_reported") || s.includes("omitted") || s.includes("none") || s.includes("missing")) return "not_reported";
    if (s.includes("not_established") || s.includes("unverified") || s.includes("unknown") || s.includes("gap")) return "not_established";
    return "from_document";
  }
  return "from_document";
}, z.enum(["from_document", "ai_interpretation", "not_reported", "not_established"]).default("from_document"));

export const researchIdentitySchema = z.object({
  title: z.string().min(1).default("Academic Research Paper"),
  authors: stringArrayCoerce.default([]),
  publicationYear: z.union([z.string(), z.number()]).optional(),
  journalOrConference: z.string().optional(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  openAccessStatus: z.string().optional(),
  researchDomain: z.string().optional().default("Computer Science / Artificial Intelligence"),
  pageCount: z.number().int().positive().default(1),
  sourceType: z.string().default("uploaded_pdf"),
});

export const executiveResearchOverviewSchema = z.object({
  beginnerExplanation: z.string().min(1).default("This paper explores an academic research question."),
  beginnerAnalogy: z.string().default("Imagine a process where multiple components collaborate in parallel."),
  technicalContribution: z.string().min(1).default("Presents an empirical methodology and theoretical contribution."),
  problemAddressed: z.string().default("Addressing existing computational or theoretical bottlenecks."),
  whyItMatters: z.string().default("Enables more efficient and scalable academic inquiry."),
  whatDiscovered: z.string().default("Achieved measurable empirical improvements over tested baselines."),
  whoBenefits: stringArrayCoerce.default(["Academic researchers", "Industry practitioners", "Students"]),
});

export const metricCardSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "string") {
      return {
        label: "Metric",
        headline: val,
        detail: val,
        status: "from_document",
        pageReferences: [],
      };
    }
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        label: typeof obj.label === "string" ? obj.label : "Metric",
        headline: typeof obj.headline === "string" ? obj.headline : typeof obj.title === "string" ? obj.title : String(obj.value || obj.text || "Reported"),
        detail: typeof obj.detail === "string" ? obj.detail : typeof obj.description === "string" ? obj.description : String(obj.text || obj.headline || ""),
        status: obj.status || "from_document",
        pageReferences: obj.pageReferences || [],
      };
    }
    return val;
  },
  z.object({
    label: z.string().default("Metric"),
    headline: z.string().min(1).default("Reported"),
    detail: z.string().default(""),
    status: explorerEvidenceStatusSchema,
    pageReferences: pageReferencesCoerce,
  })
);

export const researchAtAGlanceSchema = z.object({
  coreObjective: metricCardSchema,
  methodologyApproach: metricCardSchema,
  datasetOrSample: metricCardSchema,
  keyEmpiricalResult: metricCardSchema,
  computationalCost: metricCardSchema,
  primaryLimitations: metricCardSchema,
  reproducibilityStatus: metricCardSchema,
  ethicalStatus: metricCardSchema,
});

export const explorerSectionItemSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        id: obj.id || `sec_${Math.random().toString(36).substring(2, 9)}`,
        sectionNumber: typeof obj.sectionNumber === "number" ? obj.sectionNumber : 1,
        title: typeof obj.title === "string" ? obj.title : typeof obj.heading === "string" ? obj.heading : "Research Dimension",
        cluster: obj.cluster || "foundation",
        beginnerExplanation:
          typeof obj.beginnerExplanation === "string"
            ? obj.beginnerExplanation
            : typeof obj.beginnerText === "string"
            ? obj.beginnerText
            : String(obj.content || obj.summary || "Summary"),
        researcherTechnical:
          typeof obj.researcherTechnical === "string"
            ? obj.researcherTechnical
            : typeof obj.technicalDetail === "string"
            ? obj.technicalDetail
            : String(obj.content || obj.detail || "Technical formulation"),
        evidenceStatus: obj.evidenceStatus || "from_document",
        pageReferences: obj.pageReferences || [],
        quote: typeof obj.quote === "string" ? obj.quote : undefined,
        bulletPoints: obj.bulletPoints || [],
        keyValuePairs: obj.keyValuePairs || [],
      };
    }
    return val;
  },
  z.object({
    id: z.string().default(() => `sec_${Math.random().toString(36).substring(2, 9)}`),
    sectionNumber: z.number().int().default(1),
    title: z.string().min(1).default("Section"),
    cluster: z.enum(["foundation", "methodology", "experiments", "evaluation", "impact"]).default("foundation"),
    beginnerExplanation: z.string().min(1).default(""),
    researcherTechnical: z.string().min(1).default(""),
    evidenceStatus: explorerEvidenceStatusSchema,
    pageReferences: pageReferencesCoerce,
    quote: z.string().optional(),
    bulletPoints: stringArrayCoerce.default([]),
    keyValuePairs: z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
          page: z.number().optional(),
        })
      )
      .default([]),
  })
);

export const chartDataPointSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      const rawNum = typeof obj.value === "number" ? obj.value : parseFloat(String(obj.value || 0));
      return {
        category: String(obj.category || obj.name || obj.label || "Sample"),
        value: isNaN(rawNum) ? 0 : rawNum,
        isProposed: Boolean(obj.isProposed || obj.proposed || obj.ours),
        baseline: Boolean(obj.baseline),
      };
    }
    return val;
  },
  z.object({
    category: z.string().min(1),
    value: z.number(),
    isProposed: z.boolean().default(false),
    baseline: z.boolean().default(false),
  })
);

export const reconstructedChartSchema = z.object({
  id: z.string().default(() => `chart_${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().min(1).default("Benchmark Comparison"),
  chartType: z.enum(["bar", "line", "comparison"]).default("bar"),
  xAxisLabel: z.string().default("Model / Condition"),
  yAxisLabel: z.string().default("Metric Value"),
  unit: z.string().default("Score"),
  sourceTableOrSection: z.string().default("Results Table"),
  pageNumber: z.number().int().positive().default(1),
  caption: z.string().default("Reconstructed from published tabular data."),
  data: z.array(chartDataPointSchema).default([]),
});

export const workflowStepSchema = z.object({
  stepNumber: z.number().int().default(1),
  title: z.string().min(1).default("Process Step"),
  description: z.string().default(""),
  technicalNote: z.string().optional(),
  pageReference: z.number().optional(),
});

export const workflowDiagramSchema = z.object({
  id: z.string().default(() => `diag_${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().min(1).default("Methodology Workflow"),
  diagramType: z.enum(["pipeline", "architecture", "concept_map"]).default("pipeline"),
  caption: z.string().default("Synthesized research execution flow."),
  sourcePage: z.number().int().positive().default(1),
  steps: z.array(workflowStepSchema).default([]),
});

export const glossaryTermSchema = z.object({
  term: z.string().min(1).default("Term"),
  plainDefinition: z.string().min(1).default(""),
  technicalDefinition: z.string().min(1).default(""),
  analogy: z.string().optional(),
  pageReferences: pageReferencesCoerce,
});

export const keyCitationSchema = z.object({
  citationText: z.string().min(1).default("Citation"),
  relevance: z.string().default("Baseline comparison"),
  isBaseline: z.boolean().default(false),
  pageReferences: pageReferencesCoerce,
});

export const researchExplorerDataSchema = z.object({
  id: z.string().default(() => `exp_${Math.random().toString(36).substring(2, 10)}`),
  documentId: z.string().min(1),
  identity: researchIdentitySchema,
  executiveOverview: executiveResearchOverviewSchema,
  atAGlance: researchAtAGlanceSchema,
  sections: z.array(explorerSectionItemSchema).default([]),
  reconstructedCharts: z.array(reconstructedChartSchema).default([]),
  workflowDiagrams: z.array(workflowDiagramSchema).default([]),
  glossary: z.array(glossaryTermSchema).default([]),
  keyCitations: z.array(keyCitationSchema).default([]),
  modelId: z.string(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedResearchExplorerData = z.infer<typeof researchExplorerDataSchema>;
