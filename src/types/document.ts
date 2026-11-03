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
