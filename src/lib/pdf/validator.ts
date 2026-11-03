import path from "path";
import { getServerConfig } from "@/lib/validation/env.schema";

export class PDFValidationError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code = "PDF_VALIDATION_ERROR", status = 400) {
    super(message);
    this.name = "PDFValidationError";
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PDFPayloadTooLargeError extends PDFValidationError {
  constructor(maxBytes: number, actualBytes: number) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (actualBytes / (1024 * 1024)).toFixed(2);
    super(
      `File size (${actualMb} MB) exceeds maximum allowed limit of ${maxMb} MB.`,
      "PAYLOAD_TOO_LARGE",
      413
    );
    this.name = "PDFPayloadTooLargeError";
  }
}

export class PDFEmptyFileError extends PDFValidationError {
  constructor(message = "Uploaded file is empty (0 bytes).") {
    super(message, "EMPTY_FILE", 400);
    this.name = "PDFEmptyFileError";
  }
}

export class PDFInvalidSignatureError extends PDFValidationError {
  constructor(
    message = "File does not contain a valid PDF signature (%PDF-). The file may be corrupted or not a real PDF."
  ) {
    super(message, "INVALID_FILE_SIGNATURE", 415);
    this.name = "PDFInvalidSignatureError";
  }
}

export class PDFUnsupportedTypeError extends PDFValidationError {
  constructor(message = "Only PDF documents (.pdf) are supported.") {
    super(message, "UNSUPPORTED_MEDIA_TYPE", 415);
    this.name = "PDFUnsupportedTypeError";
  }
}

/**
 * Sanitizes user-provided filename by extracting the basename,
 * removing control characters, and limiting length.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "document.pdf";
  }

  // Normalize Windows separators to posix and extract basename
  const normalized = filename.replace(/\\/g, "/");
  let base = path.posix.basename(normalized);

  // Remove null bytes and control characters
  base = base
    .replace(/\0/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[/\\]/g, "")
    .trim();

  // If filename doesn't end with .pdf, append it
  if (!base.toLowerCase().endsWith(".pdf")) {
    base = `${base}.pdf`;
  }

  // Cap length to 100 characters before extension
  if (base.length > 100) {
    const ext = ".pdf";
    base = `${base.slice(0, 100 - ext.length)}${ext}`;
  }

  return base || "document.pdf";
}

/**
 * Generates an internal safe document ID.
 */
export function generateDocumentId(): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `doc_${timestamp}_${random}`;
}

export interface PDFValidationResult {
  isValid: boolean;
  sanitizedFilename: string;
  documentId: string;
  fileSizeBytes: number;
}

/**
 * Validates a PDF file buffer against size, MIME, magic bytes, and filename constraints.
 */
export function validatePDFBuffer(
  buffer: Buffer | Uint8Array,
  originalFilename?: string,
  clientMimeType?: string
): PDFValidationResult {
  const config = getServerConfig();
  const maxBytes = config.maxUploadSizeBytes || 10485760;
  const fileSizeBytes = buffer.byteLength;

  // 1. Check empty file
  if (!buffer || fileSizeBytes === 0) {
    throw new PDFEmptyFileError();
  }

  // 2. Check maximum file size
  if (fileSizeBytes > maxBytes) {
    throw new PDFPayloadTooLargeError(maxBytes, fileSizeBytes);
  }

  // 3. Check client MIME type if provided
  if (clientMimeType) {
    const normalizedMime = clientMimeType.toLowerCase().trim();
    if (
      normalizedMime !== "application/pdf" &&
      normalizedMime !== "application/x-pdf" &&
      normalizedMime !== "application/acrobat" &&
      normalizedMime !== "applications/vnd.pdf" &&
      normalizedMime !== "application/octet-stream"
    ) {
      throw new PDFUnsupportedTypeError(
        `Invalid MIME type '${clientMimeType}'. Only PDF documents are supported.`
      );
    }
  }

  // 4. Check PDF File Signature (Magic Bytes: %PDF-)
  const headerSearchLimit = Math.min(fileSizeBytes, 1024);
  const headerSlice = Buffer.from(buffer.slice(0, headerSearchLimit)).toString("ascii");

  if (!headerSlice.includes("%PDF-")) {
    throw new PDFInvalidSignatureError();
  }

  const sanitizedFilename = sanitizeFilename(originalFilename || "document.pdf");
  const documentId = generateDocumentId();

  return {
    isValid: true,
    sanitizedFilename,
    documentId,
    fileSizeBytes,
  };
}
