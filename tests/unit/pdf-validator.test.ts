import { describe, it, expect } from "vitest";
import {
  validatePDFBuffer,
  sanitizeFilename,
  generateDocumentId,
  PDFEmptyFileError,
  PDFPayloadTooLargeError,
  PDFInvalidSignatureError,
  PDFUnsupportedTypeError,
} from "@/lib/pdf/validator";
import {
  createValidSinglePagePdfBuffer,
  createNonPdfBuffer,
} from "../fixtures/pdf-fixtures";

describe("PDF Validator (Unit)", () => {
  it("successfully validates a valid PDF buffer", () => {
    const buffer = createValidSinglePagePdfBuffer();
    const result = validatePDFBuffer(buffer, "sample-paper.pdf", "application/pdf");

    expect(result.isValid).toBe(true);
    expect(result.sanitizedFilename).toBe("sample-paper.pdf");
    expect(result.documentId).toMatch(/^doc_\d+_[a-f0-9]+$/);
    expect(result.fileSizeBytes).toBe(buffer.byteLength);
  });

  it("throws PDFEmptyFileError for 0-byte buffer", () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(() => validatePDFBuffer(emptyBuffer, "empty.pdf")).toThrow(PDFEmptyFileError);
  });

  it("throws PDFInvalidSignatureError when magic bytes %PDF- are missing", () => {
    const nonPdfBuffer = createNonPdfBuffer();
    expect(() => validatePDFBuffer(nonPdfBuffer, "fake.pdf")).toThrow(PDFInvalidSignatureError);
  });

  it("throws PDFUnsupportedTypeError when client MIME type is not PDF", () => {
    const buffer = createValidSinglePagePdfBuffer();
    expect(() =>
      validatePDFBuffer(buffer, "test.pdf", "image/png")
    ).toThrow(PDFUnsupportedTypeError);
  });

  it("throws PDFPayloadTooLargeError when file size exceeds maximum limit", () => {
    // 11 MB buffer with valid PDF header
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);
    oversizedBuffer.write("%PDF-1.4\n", 0);

    expect(() => validatePDFBuffer(oversizedBuffer, "large.pdf")).toThrow(PDFPayloadTooLargeError);
  });

  it("sanitizes filenames by removing traversal characters, slashes, and control chars", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd.pdf");
    expect(sanitizeFilename("C:\\Users\\Admin\\My Research.pdf")).toBe("My Research.pdf");
    expect(sanitizeFilename("research\0injection.pdf")).toBe("researchinjection.pdf");
    expect(sanitizeFilename("")).toBe("document.pdf");
  });

  it("generates unique safe document IDs", () => {
    const id1 = generateDocumentId();
    const id2 = generateDocumentId();

    expect(id1).not.toBe(id2);
    expect(id1.startsWith("doc_")).toBe(true);
    expect(id2.startsWith("doc_")).toBe(true);
  });
});
