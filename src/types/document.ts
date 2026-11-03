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

export interface DocumentItem {
  id: string;
  projectId?: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount?: number;
  processingStatus: DocumentProcessingStatus;
  extractionStatus: ExtractionStatus;
  textPreview?: string;
  createdAt: string;
}
