import { DocumentSourceType, OpenAccessStatus, ExtractedDocument } from "./document";

export interface ScholarlyMetadata {
  title?: string;
  authors?: string[];
  publicationYear?: number;
  journalOrConference?: string;
  doi?: string;
  arxivId?: string;
  abstract?: string;
  openAccessStatus?: OpenAccessStatus;
  pdfUrl?: string;
  landingPageUrl?: string;
  metadataProvider: "crossref" | "openalex" | "semanticscholar" | "arxiv" | "unpaywall" | "direct" | "unknown";
}

export interface SourceResolutionResult {
  detectedType: DocumentSourceType | "unsupported";
  normalizedIdentifier: string;
  rawInput: string;
  metadata?: ScholarlyMetadata;
  pdfUrl?: string;
  isOpenAccess: boolean;
  fullTextAvailable: boolean;
  landingPageUrl?: string;
  accessNote?: string;
}

export interface ImportSourceRequestBody {
  source: string;
  customTitle?: string;
}

export interface ImportSourceResponse {
  success: boolean;
  data?: {
    resolution: SourceResolutionResult;
    fullTextAvailable: boolean;
    document?: ExtractedDocument;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
