import { describe, it, expect } from "vitest";
import {
  extractPDF,
  PDFCorruptedError,
  PDFInvalidSignatureError,
  PDFEmptyFileError,
} from "@/lib/pdf";
import {
  createValidSinglePagePdfBuffer,
  createValidMultiPagePdfBuffer,
  createScannedNoTextPdfBuffer,
  createCorruptedPdfBuffer,
  createNonPdfBuffer,
} from "../fixtures/pdf-fixtures";

describe("PDF Extractor (Unit)", () => {
  it("successfully extracts text and metadata from a valid single-page PDF", async () => {
    const buffer = createValidSinglePagePdfBuffer();
    const doc = await extractPDF(buffer, {
      originalFilename: "deep-learning.pdf",
    });

    expect(doc.metadata.originalFilename).toBe("deep-learning.pdf");
    expect(doc.metadata.pageCount).toBe(1);
    expect(doc.metadata.isScanned).toBe(false);
    expect(doc.metadata.ocrRequired).toBe(false);
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0].pageNumber).toBe(1);
    expect(doc.pages[0].text).toContain("Transformers are neural network architectures");
    expect(doc.pages[0].wordCount).toBeGreaterThan(0);
    expect(doc.fullText).toContain("--- Page 1 ---");
  });

  it("extracts text page-by-page preserving exact page boundaries for multi-page PDF", async () => {
    const buffer = createValidMultiPagePdfBuffer();
    const doc = await extractPDF(buffer, {
      originalFilename: "multi-page-paper.pdf",
    });

    expect(doc.metadata.pageCount).toBe(2);
    expect(doc.pages).toHaveLength(2);
    expect(doc.pages[0].pageNumber).toBe(1);
    expect(doc.pages[0].text).toContain("First page empirical results");
    expect(doc.pages[1].pageNumber).toBe(2);
    expect(doc.pages[1].text).toContain("Second page analytical review");
    expect(doc.fullText).toContain("--- Page 1 ---");
    expect(doc.fullText).toContain("--- Page 2 ---");
  });

  it("detects scanned/image-only PDF with negligible text and flags OCR requirement", async () => {
    const buffer = createScannedNoTextPdfBuffer();
    const doc = await extractPDF(buffer, {
      originalFilename: "scanned-document.pdf",
    });

    expect(doc.metadata.isScanned).toBe(true);
    expect(doc.metadata.ocrRequired).toBe(true);
    expect(doc.metadata.totalWordCount).toBe(0);
  });

  it("rejects corrupted PDF with PDFCorruptedError", async () => {
    const buffer = createCorruptedPdfBuffer();
    await expect(extractPDF(buffer)).rejects.toThrow(PDFCorruptedError);
  });

  it("rejects non-PDF buffer with PDFInvalidSignatureError", async () => {
    const buffer = createNonPdfBuffer();
    await expect(extractPDF(buffer)).rejects.toThrow(PDFInvalidSignatureError);
  });

  it("rejects 0-byte buffer with PDFEmptyFileError", async () => {
    const buffer = Buffer.alloc(0);
    await expect(extractPDF(buffer)).rejects.toThrow(PDFEmptyFileError);
  });
});
