import { z } from "zod";

export const evidenceLabelSchema = z.enum([
  "from_document",
  "retrieved_source",
  "ai_interpretation",
  "not_established",
]);

/**
 * Resilient array coercion helper for LLM outputs.
 * Converts comma-delimited strings or single strings into string arrays,
 * ensuring strict schema adherence even when models emit single string values.
 */
export const stringArrayCoerce = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "string" ? v.trim() : String(v))).filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.includes(",") || trimmed.includes(";")) {
      return trimmed.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return val;
}, z.array(z.string()).default([]));

/**
 * Resilient page references coercion helper for LLM outputs.
 * Accepts numbers, number arrays, or parseable strings, ensuring clean page number arrays.
 */
export const pageReferencesCoerce = z.preprocess((val) => {
  if (typeof val === "number") {
    return val > 0 ? [val] : [];
  }
  if (typeof val === "string") {
    const parsed = parseInt(val.trim(), 10);
    return !isNaN(parsed) && parsed > 0 ? [parsed] : [];
  }
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "number" ? item : parseInt(String(item), 10)))
      .filter((n) => typeof n === "number" && !isNaN(n) && n > 0);
  }
  return [];
}, z.array(z.number().int().positive()).default([]));

export const analyzeTopicRequestSchema = z.object({
  topic: z
    .string()
    .min(5, "Research topic must be at least 5 characters long")
    .max(1000, "Research topic cannot exceed 1000 characters")
    .trim(),
  scope: z
    .string()
    .max(500, "Scope description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type AnalyzeTopicRequest = z.infer<typeof analyzeTopicRequestSchema>;

export const analyzeDocumentRequestSchema = z.object({
  focusArea: z
    .string()
    .max(500, "Focus area description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type AnalyzeDocumentRequest = z.infer<typeof analyzeDocumentRequestSchema>;

export const findingItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  finding: z.string().min(1, "Finding statement is required"),
  evidenceSource: evidenceLabelSchema.default("from_document"),
  pageReferences: pageReferencesCoerce,
  quote: z.string().optional().default(""),
  confidenceNotes: z.string().optional().default(""),
});

export const researchThemeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  significance: z.string().optional(),
});

export const researchReportSchema = z.object({
  id: z.string().default(() => `res_${Math.random().toString(36).substring(2, 10)}`),
  title: z.string().min(1),
  researchQuestion: z.string().min(1),
  scope: z.string().optional().default(""),
  executiveSummary: z.string().min(1),
  backgroundContext: z.string().optional().default(""),
  methodologyOverview: z.string().optional().default(""),
  keyFindings: z.array(findingItemSchema).min(1, "At least one key finding is required"),
  criticalAnalysis: z.string().optional().default(""),
  strengths: stringArrayCoerce,
  limitations: stringArrayCoerce,
  researchGaps: stringArrayCoerce,
  conclusion: z.string().min(1),
  suggestedFollowUps: stringArrayCoerce,
  evidenceStatus: evidenceLabelSchema.default("ai_interpretation"),
  modelId: z.string(),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedResearchReport = z.infer<typeof researchReportSchema>;

// ---------------------------------------------------------------------------
// Phase 4: Grounded Document Analysis Schemas
// ---------------------------------------------------------------------------

export const objectiveItemSchema = z.object({
  objective: z.string().min(1),
  pageReferences: pageReferencesCoerce,
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const detailedSectionSchema = z.object({
  heading: z.string().min(1),
  content: z.string().min(1),
  pageReferences: pageReferencesCoerce,
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const methodologyAssessmentSchema = z.object({
  approach: z.string().min(1),
  datasetsUsed: stringArrayCoerce,
  baselines: stringArrayCoerce,
  evaluationMetrics: stringArrayCoerce,
  methodologicalRigor: z.string().min(1),
  pageReferences: pageReferencesCoerce,
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const conceptItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  pageReferences: pageReferencesCoerce,
});

export const documentAnalysisOverviewSchema = z.object({
  title: z.string().min(1),
  documentId: z.string().min(1),
  originalFilename: z.string().min(1),
  totalPages: z.number().int().positive(),
  analyzedPages: pageReferencesCoerce,
  coveragePercentage: z.number().min(0).max(100),
  isPartialCoverage: z.boolean(),
  totalWordCount: z.number().int().nonnegative(),
});

export const documentAnalysisReportSchema = z.object({
  id: z.string().default(() => `doc_rep_${Math.random().toString(36).substring(2, 10)}`),
  documentId: z.string().min(1),
  overview: documentAnalysisOverviewSchema,
  executiveSummary: z.string().min(1),
  researchObjectives: z.array(objectiveItemSchema).default([]),
  keyFindings: z.array(findingItemSchema).min(1, "At least one key finding is required"),
  detailedAnalysis: z.array(detailedSectionSchema).min(1, "At least one detailed analysis section is required"),
  methodologyAssessment: methodologyAssessmentSchema,
  importantConcepts: z.array(conceptItemSchema).default([]),
  strengths: stringArrayCoerce,
  weaknesses: stringArrayCoerce,
  limitations: stringArrayCoerce,
  researchGaps: stringArrayCoerce,
  conclusion: z.string().min(1),
  suggestedFurtherResearch: stringArrayCoerce,
  modelId: z.string(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedDocumentAnalysisReport = z.infer<typeof documentAnalysisReportSchema>;
