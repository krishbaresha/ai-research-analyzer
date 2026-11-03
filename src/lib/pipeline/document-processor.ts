import * as crypto from "crypto";
import { validatePDFBuffer } from "@/lib/pdf/validator";
import { extractPDF } from "@/lib/pdf/extractor";
import { documentStore } from "@/lib/storage/document-store";
import { eventBus } from "@/lib/events/event-bus";
import {
  ExtractedDocument,
  DocumentMetadata,
  DocumentClassificationType,
  DocumentSourceType,
  ExtractedPage,
} from "@/types/document";
import { ScholarlyMetadata } from "@/types/import";

/**
 * Classifies document type using structural signals, metadata, and lexical heuristics.
 */
export function classifyDocument(
  pages: ExtractedPage[],
  meta: Partial<DocumentMetadata>
): DocumentClassificationType {
  const title = (meta.title || meta.originalFilename || "").toLowerCase();
  const firstPagesText = pages
    .slice(0, 3)
    .map((p) => p.text.toLowerCase())
    .join(" ");

  // 1. Preprint check
  if (meta.arxivId || meta.sourceType === "arxiv" || firstPagesText.includes("arxiv:") || firstPagesText.includes("preprint")) {
    return "preprint";
  }

  // 2. Review article or survey
  if (
    title.includes("survey") ||
    title.includes("systematic review") ||
    title.includes("meta-analysis") ||
    firstPagesText.includes("a comprehensive survey") ||
    firstPagesText.includes("literature review")
  ) {
    return "review_article";
  }

  // 3. Thesis or dissertation
  if (
    firstPagesText.includes("submitted in partial fulfillment") ||
    firstPagesText.includes("doctoral dissertation") ||
    firstPagesText.includes("master's thesis") ||
    title.includes("dissertation")
  ) {
    return "thesis";
  }

  // 4. Conference paper
  const venue = (meta.journalOrConference || "").toLowerCase();
  if (
    venue.includes("conference") ||
    venue.includes("proceedings") ||
    venue.includes("symposium") ||
    venue.includes("workshop") ||
    firstPagesText.includes("proceedings of")
  ) {
    return "conference_paper";
  }

  // 5. Technical report
  if (title.includes("technical report") || firstPagesText.includes("technical report") || title.includes("whitepaper")) {
    return "technical_report";
  }

  // 6. Default standard research paper
  if (
    firstPagesText.includes("abstract") &&
    (firstPagesText.includes("introduction") || firstPagesText.includes("method"))
  ) {
    return "research_paper";
  }

  return "unknown";
}

/**
 * Computes deterministic SHA-256 content hash of buffer.
 */
export function computeContentHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export interface ProcessDocumentOptions {
  buffer: Buffer;
  originalFilename: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
  scholarlyMetadata?: ScholarlyMetadata;
}

/**
 * Unified Smart Document Processing Pipeline.
 * Handles validation, text extraction, metadata attachment, classification,
 * storage persistence, and domain event emission for both uploaded and imported documents.
 */
export async function processDocument(
  options: ProcessDocumentOptions
): Promise<ExtractedDocument> {
  const { buffer, originalFilename, sourceType, sourceUrl, scholarlyMetadata } = options;

  // 1. Validate PDF Buffer (%PDF- signature, size check, safe ID generation)
  const validationResult = validatePDFBuffer(buffer, originalFilename);

  // 2. Extract Text Streams Page-by-Page via unpdf
  const extractionResult = await extractPDF(buffer, {
    originalFilename,
    documentIdOverride: validationResult.documentId,
  });

  // 3. Compute Content Hash
  const contentHash = computeContentHash(buffer);

  // 4. Assemble Extended Document Metadata
  const mergedTitle = scholarlyMetadata?.title || validationResult.sanitizedFilename.replace(/\.pdf$/i, "");
  const classification = classifyDocument(extractionResult.pages, {
    title: mergedTitle,
    journalOrConference: scholarlyMetadata?.journalOrConference,
    arxivId: scholarlyMetadata?.arxivId,
    sourceType,
  });

  const metadata: DocumentMetadata = {
    ...extractionResult.metadata,
    sourceType,
    sourceUrl,
    doi: scholarlyMetadata?.doi,
    arxivId: scholarlyMetadata?.arxivId,
    title: mergedTitle,
    authors: scholarlyMetadata?.authors,
    publicationYear: scholarlyMetadata?.publicationYear,
    journalOrConference: scholarlyMetadata?.journalOrConference,
    openAccessStatus: scholarlyMetadata?.openAccessStatus || (sourceType === "arxiv" ? "green" : "unknown"),
    metadataProvider: scholarlyMetadata?.metadataProvider,
    importedAt: new Date().toISOString(),
    contentHash,
    documentType: classification,
    abstract: scholarlyMetadata?.abstract,
  };

  const extractedDocument: ExtractedDocument = {
    metadata,
    pages: extractionResult.pages,
    fullText: extractionResult.fullText,
  };

  // 5. Store in In-Memory DocumentStore
  await documentStore.save(extractedDocument);

  // 6. Emit Domain Events for Future Automations (Phase 10)
  const eventTimestamp = new Date().toISOString();

  if (sourceType === "upload") {
    await eventBus.emit({
      id: `evt_${Date.now()}_up`,
      type: "document.uploaded",
      timestamp: eventTimestamp,
      payload: {
        documentId: metadata.id,
        filename: metadata.sanitizedFilename,
        sizeBytes: metadata.fileSizeBytes,
      },
    });
  } else {
    await eventBus.emit({
      id: `evt_${Date.now()}_imp`,
      type: "document.imported",
      timestamp: eventTimestamp,
      payload: {
        documentId: metadata.id,
        sourceType,
        sourceUrl,
        doi: metadata.doi,
        arxivId: metadata.arxivId,
      },
    });
  }

  await eventBus.emit({
    id: `evt_${Date.now()}_ext`,
    type: "document.extracted",
    timestamp: eventTimestamp,
    payload: {
      documentId: metadata.id,
      pageCount: metadata.pageCount,
      wordCount: metadata.totalWordCount,
      isScanned: metadata.isScanned,
    },
  });

  await eventBus.emit({
    id: `evt_${Date.now()}_cls`,
    type: "document.classified",
    timestamp: eventTimestamp,
    payload: {
      documentId: metadata.id,
      classification,
    },
  });

  return extractedDocument;
}
