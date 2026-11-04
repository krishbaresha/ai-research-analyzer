import {
  researchExplorerDataSchema,
  ValidatedResearchExplorerData,
} from "../validation/research-explorer.schema";
import { sanitizeModelJsonString } from "./parsers";
import { AIResponseParseError } from "./provider";
import { DocumentMetadata } from "@/types/document";

/**
 * Parses and validates raw LLM output against the ResearchExplorerData schema.
 */
export function parseAndValidateResearchExplorer(
  rawText: string,
  modelId: string,
  documentId: string,
  metadata: DocumentMetadata
): ValidatedResearchExplorerData {
  const sanitized = sanitizeModelJsonString(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitized);
  } catch (error) {
    const parseMsg = error instanceof Error ? error.message : "Invalid JSON";
    throw new AIResponseParseError(
      `Model returned invalid JSON for Research Explorer: ${parseMsg}`,
      rawText
    );
  }

  // Inject known metadata if missing or minimal
  if (typeof parsedJson === "object" && parsedJson !== null) {
    const obj = parsedJson as Record<string, unknown>;
    obj.documentId = documentId;
    obj.modelId = modelId;
    obj.generatedAt = new Date().toISOString();

    if (!obj.identity || typeof obj.identity !== "object") {
      obj.identity = {
        title: metadata.title || metadata.originalFilename,
        authors: metadata.authors || [],
        publicationYear: metadata.publicationYear,
        journalOrConference: metadata.journalOrConference,
        doi: metadata.doi,
        arxivId: metadata.arxivId,
        openAccessStatus: metadata.openAccessStatus,
        pageCount: metadata.pageCount,
        sourceType: metadata.sourceType || "uploaded_pdf",
      };
    }
  }

  const result = researchExplorerDataSchema.safeParse(parsedJson);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AIResponseParseError(
      `Research Explorer output failed schema validation: ${issues}`,
      rawText
    );
  }

  return result.data;
}
