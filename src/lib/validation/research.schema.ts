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

export const findingItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  finding: z.string().min(1),
  evidenceSource: evidenceLabelSchema.default("ai_interpretation"),
  pageReferences: z.array(z.number()).optional(),
  quote: z.string().optional(),
  confidenceNotes: z.string().optional(),
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
