import { describe, it, expect } from "vitest";
import {
  tokenizeKeywords,
  extractRequestedPageNumber,
  chunkPage,
  chunkDocument,
  retrieveRelevantPassages,
} from "@/lib/retrieval/retriever";
import { ExtractedDocument, ExtractedPage } from "@/types/document";

describe("Document Retriever (Unit)", () => {
  const createMockDocument = (pageCount: number): ExtractedDocument => {
    const pages: ExtractedPage[] = [];
    for (let i = 1; i <= pageCount; i++) {
      let pageText = `Page ${i} background context on neural network optimization. `;
      if (i === 1) {
        pageText += "Abstract: We investigate FlashAttention and memory hierarchy IO bandwidth.";
      } else if (i === 4) {
        pageText += "Methodology: Block-sparse attention divides sequence into tiles of size B=64 to maximize SRAM residency.";
      } else if (i === 8) {
        pageText += "Empirical Benchmarks: Wall-clock training speedup of 3.4x observed on NVIDIA A100 GPU clusters.";
      } else if (i === 15) {
        // Excluded from Phase 4 strategic sample (which samples 1-3, 14-15 or similar, but here 15 is later)
        pageText += "Ablation Study: Quantization error with 8-bit floating point representations (FP8) maintains perplexity.";
      } else if (i === pageCount) {
        pageText += "Conclusion: IO-aware attention transforms large scale transformer training.";
      }
      pages.push({
        pageNumber: i,
        text: pageText,
        charCount: pageText.length,
        wordCount: pageText.split(/\s+/).length,
      });
    }

    return {
      metadata: {
        id: "doc_retrieval_test",
        originalFilename: "flash_attention_study.pdf",
        sanitizedFilename: "flash_attention_study.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024 * pageCount,
        pageCount,
        totalWordCount: 500 * pageCount,
        totalCharCount: 3000 * pageCount,
        isScanned: false,
        ocrRequired: false,
        isEncrypted: false,
        uploadedAt: new Date().toISOString(),
      },
      pages,
      fullText: pages.map((p) => p.text).join("\n"),
    };
  };

  it("extracts and normalizes query keywords filtering stop words", () => {
    const keywords = tokenizeKeywords(
      "What is the empirical methodology and benchmark speedup of FlashAttention in the paper?"
    );

    expect(keywords).toContain("empirical");
    expect(keywords).toContain("methodology");
    expect(keywords).toContain("benchmark");
    expect(keywords).toContain("speedup");
    expect(keywords).toContain("flashattention");
    expect(keywords).not.toContain("what");
    expect(keywords).not.toContain("the");
    expect(keywords).not.toContain("and");
    expect(keywords).not.toContain("paper");
  });

  it("extracts explicit page numbers from queries", () => {
    expect(extractRequestedPageNumber("What is on page 4?")).toBe(4);
    expect(extractRequestedPageNumber("Summarize results on p. 12")).toBe(12);
    expect(extractRequestedPageNumber("Explain the general methodology")).toBeNull();
  });

  it("chunks long pages preserving exact 1-indexed page boundaries", () => {
    const longPage: ExtractedPage = {
      pageNumber: 7,
      text: "Sentence one about transformers. Sentence two about attention. Sentence three about kernels. ".repeat(
        20
      ),
      charCount: 1880,
      wordCount: 260,
    };

    const chunks = chunkPage(longPage, "doc_test", 800, 100);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.pageNumber).toBe(7);
      expect(chunk.documentId).toBe("doc_test");
      expect(chunk.charCount).toBeLessThanOrEqual(950); // with boundary leeway
    }
  });

  it("retrieves relevant passages from earlier, middle, and later pages", () => {
    const doc = createMockDocument(20);

    // Query targeting middle page (page 4)
    const result1 = retrieveRelevantPassages(doc, "block-sparse attention tiles SRAM residency");
    expect(result1.hasRelevantPassages).toBe(true);
    expect(result1.pagesUsed).toContain(4);
    expect(result1.pagesSearched).toBe(20);
    expect(result1.partialCoverage).toBe(false);

    // Query targeting later page (page 15)
    const result2 = retrieveRelevantPassages(doc, "FP8 quantization error ablation perplexity");
    expect(result2.hasRelevantPassages).toBe(true);
    expect(result2.pagesUsed).toContain(15);
  });

  it("prioritizes explicitly requested page numbers", () => {
    const doc = createMockDocument(10);
    const result = retrieveRelevantPassages(doc, "tell me what is on page 8");

    expect(result.hasRelevantPassages).toBe(true);
    expect(result.pagesUsed).toContain(8);
  });

  it("abstains with empty passages when query keywords do not match document content", () => {
    const doc = createMockDocument(5);
    const result = retrieveRelevantPassages(
      doc,
      "organic chemistry photosynthesis chlorophyll cellular respiration"
    );

    expect(result.passages).toHaveLength(0);
    expect(result.hasRelevantPassages).toBe(false);
    expect(result.pagesSearched).toBe(5);
    expect(result.pagesUsed).toEqual([]);
  });

  it("handles empty or zero-page documents gracefully", () => {
    const emptyDoc: ExtractedDocument = {
      metadata: {
        id: "doc_empty",
        originalFilename: "empty.pdf",
        sanitizedFilename: "empty.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 0,
        pageCount: 0,
        totalWordCount: 0,
        totalCharCount: 0,
        isScanned: false,
        ocrRequired: false,
        isEncrypted: false,
        uploadedAt: new Date().toISOString(),
      },
      pages: [],
      fullText: "",
    };

    const result = retrieveRelevantPassages(emptyDoc, "Any question?");
    expect(result.passages).toHaveLength(0);
    expect(result.hasRelevantPassages).toBe(false);
  });
});
