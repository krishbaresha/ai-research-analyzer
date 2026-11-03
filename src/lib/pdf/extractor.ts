import { extractText } from "unpdf";
import { ExtractedDocument, ExtractedPage, DocumentMetadata } from "@/types/document";
import { PDFValidationError, validatePDFBuffer } from "./validator";

export class PDFExtractionError extends PDFValidationError {
  constructor(message = "Failed to extract text from PDF document.", code = "PDF_EXTRACTION_ERROR", status = 422) {
    super(message, code, status);
    this.name = "PDFExtractionError";
  }
}

export class PDFCorruptedError extends PDFExtractionError {
  constructor(message = "The PDF file is corrupted or structurally invalid.") {
    super(message, "CORRUPTED_PDF", 422);
    this.name = "PDFCorruptedError";
  }
}

export class PDFEncryptedError extends PDFExtractionError {
  constructor(message = "The PDF file is encrypted or password-protected. Decryption is not supported.") {
    super(message, "ENCRYPTED_PDF", 422);
    this.name = "PDFEncryptedError";
  }
}

export class PDFEmptyDocumentError extends PDFExtractionError {
  constructor(message = "The PDF contains 0 pages or no extractable structure.") {
    super(message, "EMPTY_DOCUMENT", 422);
    this.name = "PDFEmptyDocumentError";
  }
}

export interface ExtractPDFOptions {
  originalFilename?: string;
  clientMimeType?: string;
  documentIdOverride?: string;
}

/**
 * Normalizes text extracted from a page.
 */
function cleanPageText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Calculates word count from a text string.
 */
function calculateWordCount(text: string): number {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Converts Buffer or Uint8Array to a pure, non-Buffer Uint8Array required by pdf.js.
 */
function toPureUint8Array(buffer: Buffer | Uint8Array): Uint8Array {
  if (buffer instanceof Uint8Array && !Buffer.isBuffer(buffer)) {
    return buffer;
  }
  return new Uint8Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
}

/**
 * Extracts text page-by-page from a PDF buffer while preserving exact page boundaries.
 * Detects scanned/image-only documents and handles encrypted or corrupted files.
 */
export async function extractPDF(
  buffer: Buffer | Uint8Array,
  options: ExtractPDFOptions = {}
): Promise<ExtractedDocument> {
  // Step 1: Validate buffer size, signature, and filename constraints
  const validation = validatePDFBuffer(
    buffer,
    options.originalFilename,
    options.clientMimeType
  );

  const documentId = options.documentIdOverride || validation.documentId;
  const originalFilename = options.originalFilename || "document.pdf";
  const sanitizedFilename = validation.sanitizedFilename;
  const fileSizeBytes = validation.fileSizeBytes;

  try {
    // Step 2: Extract text using unpdf with pure Uint8Array without merging pages
    const uint8Array = toPureUint8Array(buffer);

    const extractionResult = await extractText(uint8Array, {
      mergePages: false,
    });

    const pageTexts: string[] = Array.isArray(extractionResult.text)
      ? extractionResult.text
      : [String(extractionResult.text || "")];

    const totalPages = extractionResult.totalPages || pageTexts.length;

    if (totalPages === 0) {
      throw new PDFEmptyDocumentError();
    }

    // Step 3: Process pages and compute page metrics
    const pages: ExtractedPage[] = [];
    let totalCharCount = 0;
    let totalWordCount = 0;

    for (let index = 0; index < pageTexts.length; index++) {
      const pageNumber = index + 1;
      const text = cleanPageText(pageTexts[index] || "");
      const charCount = text.length;
      const wordCount = calculateWordCount(text);

      pages.push({
        pageNumber,
        text,
        charCount,
        wordCount,
      });

      totalCharCount += charCount;
      totalWordCount += wordCount;
    }

    // Step 4: Scanned / Image-Only Detection
    // An academic paper has hundreds of words per page. If total text across all pages
    // is < 50 characters, or average word count per page is < 5, it is classified as scanned.
    const averageWordsPerPage = totalPages > 0 ? totalWordCount / totalPages : 0;
    const isScanned =
      totalCharCount < 50 ||
      (totalPages >= 1 && averageWordsPerPage < 5);
    const ocrRequired = isScanned;

    const fullText = pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n");

    const metadata: DocumentMetadata = {
      id: documentId,
      originalFilename,
      sanitizedFilename,
      mimeType: "application/pdf",
      fileSizeBytes,
      pageCount: totalPages,
      totalWordCount,
      totalCharCount,
      isScanned,
      ocrRequired,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
    };

    return {
      metadata,
      pages,
      fullText,
    };
  } catch (error: unknown) {
    if (error instanceof PDFValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("password") ||
      message.includes("encrypted") ||
      (message.includes("cannot read properties of null") && message.includes("encrypt"))
    ) {
      throw new PDFEncryptedError();
    }

    if (
      message.includes("invalid pdf") ||
      message.includes("format error") ||
      message.includes("corrupt") ||
      message.includes("xref") ||
      message.includes("stream end") ||
      message.includes("bad xref entry") ||
      message.includes("structure") ||
      message.includes("unknown token")
    ) {
      throw new PDFCorruptedError();
    }

    throw new PDFExtractionError(
      error instanceof Error ? error.message : "Failed to extract text from PDF document."
    );
  }
}
