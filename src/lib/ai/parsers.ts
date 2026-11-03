import { researchReportSchema, ValidatedResearchReport } from "../validation/research.schema";
import { AIResponseParseError } from "./provider";

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
 * Parses and validates raw LLM output against the ResearchReport schema.
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
    // Inject modelId and timestamp if missing
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
