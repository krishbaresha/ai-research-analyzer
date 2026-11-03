export type DocumentProcessingStatus =
  | "uploaded"
  | "parsing"
  | "extracted"
  | "failed";

export type ExtractionStatus =
  | "pending"
  | "complete"
  | "scanned_no_text"
  | "error";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  charCount: number;
  wordCount: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  charCount: number;
  metadata?: Record<string, unknown>;
}

export type DocumentSourceType = "upload" | "direct_url" | "arxiv" | "doi";

export type OpenAccessStatus =
  | "gold"
  | "green"
  | "hybrid"
  | "bronze"
  | "closed"
  | "unknown";

export type DocumentClassificationType =
  | "research_paper"
  | "review_article"
  | "preprint"
  | "conference_paper"
  | "technical_report"
  | "thesis"
  | "unknown";

export interface DocumentMetadata {
  id: string;
  originalFilename: string;
  sanitizedFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number;
  totalWordCount: number;
  totalCharCount: number;
  isScanned: boolean;
  ocrRequired: boolean;
  isEncrypted: boolean;
  uploadedAt: string;

  // Extended Scholarly & Source Metadata (Phase 5)
  sourceType?: DocumentSourceType;
  sourceUrl?: string;
  doi?: string;
  arxivId?: string;
  title?: string;
  authors?: string[];
  publicationYear?: number;
  journalOrConference?: string;
  openAccessStatus?: OpenAccessStatus;
  metadataProvider?: string;
  importedAt?: string;
  contentHash?: string;
  documentType?: DocumentClassificationType;
  abstract?: string;
}

export interface ExtractedDocument {
  metadata: DocumentMetadata;
  pages: ExtractedPage[];
  fullText: string;
}

export interface DocumentItem {
  id: string;
  projectId?: string;
  originalFilename: string;
  sanitizedFilename?: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount?: number;
  processingStatus: DocumentProcessingStatus;
  extractionStatus: ExtractionStatus;
  isScanned?: boolean;
  ocrRequired?: boolean;
  textPreview?: string;
  createdAt: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  data?: ExtractedDocument;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
