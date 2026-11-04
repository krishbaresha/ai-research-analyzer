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

  // Inject known metadata and sanitize identity
  if (typeof parsedJson === "object" && parsedJson !== null) {
    const obj = parsedJson as Record<string, unknown>;
    obj.documentId = documentId;
    obj.modelId = modelId;
    obj.generatedAt = new Date().toISOString();

    const idObj = (obj.identity && typeof obj.identity === "object" ? obj.identity : {}) as Record<string, unknown>;
    obj.identity = {
      title: metadata.title || (typeof idObj.title === "string" && idObj.title.trim()) || metadata.originalFilename,
      authors: (Array.isArray(metadata.authors) && metadata.authors.length > 0)
        ? metadata.authors
        : (Array.isArray(idObj.authors) ? idObj.authors : []),
      publicationYear: metadata.publicationYear ?? idObj.publicationYear ?? undefined,
      journalOrConference: metadata.journalOrConference || (typeof idObj.journalOrConference === "string" ? idObj.journalOrConference : undefined),
      doi: metadata.doi || (typeof idObj.doi === "string" ? idObj.doi : undefined),
      arxivId: metadata.arxivId || (typeof idObj.arxivId === "string" ? idObj.arxivId : undefined),
      openAccessStatus: metadata.openAccessStatus || (typeof idObj.openAccessStatus === "string" ? idObj.openAccessStatus : undefined),
      researchDomain: (typeof idObj.researchDomain === "string" && idObj.researchDomain.trim()) || "Computer Science / Artificial Intelligence",
      pageCount: metadata.pageCount || (typeof idObj.pageCount === "number" ? idObj.pageCount : 1),
      sourceType: metadata.sourceType || (typeof idObj.sourceType === "string" ? idObj.sourceType : "uploaded_pdf"),
    };
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
