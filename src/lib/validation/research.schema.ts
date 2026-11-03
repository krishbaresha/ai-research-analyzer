import { z } from "zod";

export const evidenceLabelSchema = z.enum([
  "from_document",
  "retrieved_source",
  "ai_interpretation",
  "not_established",
]);

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
  pageReferences: z.array(z.number().int().positive()).optional().default([]),
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
  strengths: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  researchGaps: z.array(z.string()).default([]),
  conclusion: z.string().min(1),
  suggestedFollowUps: z.array(z.string()).default([]),
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
  pageReferences: z.array(z.number().int().positive()).optional().default([]),
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const detailedSectionSchema = z.object({
  heading: z.string().min(1),
  content: z.string().min(1),
  pageReferences: z.array(z.number().int().positive()).optional().default([]),
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const methodologyAssessmentSchema = z.object({
  approach: z.string().min(1),
  datasetsUsed: z.array(z.string()).default([]),
  baselines: z.array(z.string()).default([]),
  evaluationMetrics: z.array(z.string()).default([]),
  methodologicalRigor: z.string().min(1),
  pageReferences: z.array(z.number().int().positive()).optional().default([]),
  evidenceSource: evidenceLabelSchema.default("from_document"),
});

export const conceptItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  pageReferences: z.array(z.number().int().positive()).optional().default([]),
});

export const documentAnalysisOverviewSchema = z.object({
  title: z.string().min(1),
  documentId: z.string().min(1),
  originalFilename: z.string().min(1),
  totalPages: z.number().int().positive(),
  analyzedPages: z.array(z.number().int().positive()),
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
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  researchGaps: z.array(z.string()).default([]),
  conclusion: z.string().min(1),
  suggestedFurtherResearch: z.array(z.string()).default([]),
  modelId: z.string(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedDocumentAnalysisReport = z.infer<typeof documentAnalysisReportSchema>;
