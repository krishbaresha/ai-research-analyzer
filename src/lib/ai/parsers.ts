import {
  researchReportSchema,
  ValidatedResearchReport,
  documentAnalysisReportSchema,
  ValidatedDocumentAnalysisReport,
} from "../validation/research.schema";
import {
  chatAssistantResponseSchema,
  ValidatedChatAssistantResponse,
} from "../validation/chat.schema";
import { AIResponseParseError } from "./provider";
import { BudgetedDocument } from "../pdf/budgeter";

/**
 * Strips markdown code fences (e.g. ```json ... ```) from model output.
 */
export function sanitizeModelJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Strip leading code fence
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.substring(firstNewline + 1);
    }
  }

  // Strip trailing code fence
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }

  return cleaned.trim();
}

/**
 * Parses and validates raw LLM output against the ResearchReport schema (Topic Analysis).
 */
export function parseAndValidateReport(
  rawText: string,
  modelId: string
): ValidatedResearchReport {
  const sanitized = sanitizeModelJsonString(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitized);
  } catch (error) {
    const parseMsg = error instanceof Error ? error.message : "Invalid JSON";
    throw new AIResponseParseError(
      `Model returned invalid JSON: ${parseMsg}`,
      rawText
    );
  }

  if (typeof parsedJson === "object" && parsedJson !== null) {
    const record = parsedJson as Record<string, unknown>;
    if (!record.modelId) record.modelId = modelId;
    if (!record.createdAt) record.createdAt = new Date().toISOString();
  }

  const result = researchReportSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AIResponseParseError(
      `Model output failed schema validation: ${issues}`,
      rawText
    );
  }

  return result.data;
}

/**
 * Parses and validates raw LLM output against the DocumentAnalysisReport schema (Phase 4).
 */
export function parseAndValidateDocumentReport(
  rawText: string,
  modelId: string,
  documentId: string,
  budgeted: BudgetedDocument,
  originalFilename: string,
  totalWordCount: number
): ValidatedDocumentAnalysisReport {
  const sanitized = sanitizeModelJsonString(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitized);
  } catch (error) {
    const parseMsg = error instanceof Error ? error.message : "Invalid JSON";
    throw new AIResponseParseError(
      `Model returned invalid JSON for document analysis: ${parseMsg}`,
      rawText
    );
  }

  if (typeof parsedJson === "object" && parsedJson !== null) {
    const record = parsedJson as Record<string, unknown>;
    record.modelId = modelId;
    record.documentId = documentId;
    if (!record.generatedAt) record.generatedAt = new Date().toISOString();

    // Ensure overview has verified document numbers
    if (typeof record.overview === "object" && record.overview !== null) {
      const overview = record.overview as Record<string, unknown>;
      overview.documentId = documentId;
      overview.originalFilename = originalFilename;
      overview.totalPages = budgeted.totalPages;
      overview.analyzedPages = budgeted.analyzedPages;
      overview.coveragePercentage = budgeted.coveragePercentage;
      overview.isPartialCoverage = budgeted.isPartialCoverage;
      overview.totalWordCount = totalWordCount;
    } else {
      record.overview = {
        title: typeof record.title === "string" ? record.title : "Document Analysis Report",
        documentId,
        originalFilename,
        totalPages: budgeted.totalPages,
        analyzedPages: budgeted.analyzedPages,
        coveragePercentage: budgeted.coveragePercentage,
        isPartialCoverage: budgeted.isPartialCoverage,
        totalWordCount,
      };
    }
  }

  const result = documentAnalysisReportSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AIResponseParseError(
      `Document analysis output failed schema validation: ${issues}`,
      rawText
    );
  }

  return result.data;
}

/**
 * Parses and validates raw LLM output against the ChatAssistantResponse schema (Phase 5).
 */
export function parseAndValidateChatResponse(
  rawText: string
): ValidatedChatAssistantResponse {
  const sanitized = sanitizeModelJsonString(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitized);
  } catch (error) {
    const parseMsg = error instanceof Error ? error.message : "Invalid JSON";
    throw new AIResponseParseError(
      `Model returned invalid JSON for document chat: ${parseMsg}`,
      rawText
    );
  }

  if (typeof parsedJson === "object" && parsedJson !== null) {
    const record = parsedJson as Record<string, unknown>;
    if (!record.id) {
      record.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    if (!record.role) {
      record.role = "assistant";
    }
    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }
  }

  const result = chatAssistantResponseSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AIResponseParseError(
      `Document chat output failed schema validation: ${issues}`,
      rawText
    );
  }

  return result.data;
}
