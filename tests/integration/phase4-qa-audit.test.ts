import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { extractPDF } from "@/lib/pdf";
import { budgetDocumentPages, DEFAULT_MAX_CHAR_BUDGET } from "@/lib/pdf/budgeter";
import { documentStore } from "@/lib/storage/document-store";
import { POST as analyzeRoute } from "@/app/api/documents/[id]/analyze/route";
import { POST as topicRoute } from "@/app/api/research/analyze-topic/route";
import { GET as healthRoute } from "@/app/api/health/route";
import {
  createValidSinglePagePdfBuffer,
  createValidMultiPagePdfBuffer,
  createScannedNoTextPdfBuffer,
  createCorruptedPdfBuffer,
} from "../fixtures/pdf-fixtures";
import { ExtractedDocument, ExtractedPage } from "@/types/document";
import mockReport from "../fixtures/mock-document-report.json";

// Mock the AI provider for automated suite runs
vi.mock("@/lib/ai", () => {
  return {
    getAIProvider: () => ({
      name: "openai",
      defaultModel: "gpt-4o-mini",
      analyzeTopic: vi.fn().mockResolvedValue({
        data: {
          id: "res_topic_qa",
          title: "Synthetic Topic Analysis QA",
          researchQuestion: "How do transformers scale?",
          executiveSummary: "Executive summary for topic analysis...",
          keyFindings: [
            {
              id: "kf_1",
              finding: "Quadratic attention scaling limits context length.",
              evidenceSource: "ai_interpretation",
              pageReferences: [],
              quote: "",
              confidenceNotes: "",
            },
          ],
          criticalAnalysis: "Detailed critique...",
          strengths: ["Strong scaling behavior"],
          limitations: ["High compute cost"],
          researchGaps: ["Linear attention alternatives"],
          conclusion: "Transformers remain the standard architecture.",
          suggestedFollowUps: ["Study state space models"],
          evidenceStatus: "ai_interpretation",
          modelId: "gpt-4o-mini",
          createdAt: new Date().toISOString(),
        },
        rawOutput: "{}",
        modelUsed: "gpt-4o-mini",
        processingTimeMs: 120,
      }),
      analyzeDocument: vi.fn().mockImplementation(async (opts) => {
        // Return report dynamically grounded in the document
        return {
          data: {
            ...mockReport,
            overview: {
              ...mockReport.overview,
              documentId: opts.documentId,
              totalPages: opts.document.metadata.pageCount,
              analyzedPages: opts.document.pages.map((p: any) => p.pageNumber),
              coveragePercentage: 100,
              isPartialCoverage: false,
            },
          },
          rawOutput: JSON.stringify(mockReport),
          modelUsed: "gpt-4o-mini",
          processingTimeMs: 250,
        };
      }),
    }),
  };
});

describe("Phase 4 Comprehensive QA Audit Suite", () => {
  beforeEach(async () => {
    await documentStore.clear();
  });

  describe("1. Small Academic PDF Processing", () => {
    it("successfully extracts all pages and verifies 1-indexed page numbering", async () => {
      const buffer = createValidSinglePagePdfBuffer();
      const doc = await extractPDF(buffer, { originalFilename: "small_paper.pdf" });

      expect(doc.metadata.pageCount).toBe(1);
      expect(doc.pages[0].pageNumber).toBe(1);
      expect(doc.metadata.isScanned).toBe(false);
      expect(doc.metadata.ocrRequired).toBe(false);

      const budgeted = budgetDocumentPages(doc);
      expect(budgeted.isPartialCoverage).toBe(false);
      expect(budgeted.coveragePercentage).toBe(100);
      expect(budgeted.analyzedPages).toEqual([1]);
    });

    it("verifies all 12 required sections in document analysis report", async () => {
      const buffer = createValidSinglePagePdfBuffer();
      const doc = await extractPDF(buffer, { originalFilename: "flash_attention.pdf" });
      await documentStore.save(doc);

      const request = new NextRequest(`http://localhost/api/documents/${doc.metadata.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusArea: "IO complexity" }),
      });

      const response = await analyzeRoute(request, {
        params: Promise.resolve({ id: doc.metadata.id }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);

      const data = json.data;
      // 12 Mandatory Report Sections:
      expect(data.overview).toBeDefined(); // 1. Overview
      expect(data.executiveSummary).toBeDefined(); // 2. Executive Summary
      expect(data.researchObjectives).toBeDefined(); // 3. Research Objectives
      expect(data.keyFindings).toBeDefined(); // 4. Key Findings
      expect(data.detailedAnalysis).toBeDefined(); // 5. Detailed Analysis
      expect(data.methodologyAssessment).toBeDefined(); // 6. Methodology Assessment
      expect(data.importantConcepts).toBeDefined(); // 7. Important Concepts
      expect(data.strengths).toBeDefined(); // 8. Strengths
      expect(data.weaknesses).toBeDefined(); // 9. Weaknesses
      expect(data.limitations).toBeDefined(); // 10. Limitations
      expect(data.researchGaps).toBeDefined(); // 11. Research Gaps
      expect(data.conclusion).toBeDefined(); // 12. Conclusion & Further Research
      expect(data.suggestedFurtherResearch).toBeDefined();
    });
  });

  describe("2. Multi-Page PDF & Citation Navigation Integrity", () => {
    it("ensures page numbering starts strictly at 1 and preserves sequential boundaries", async () => {
      const buffer = createValidMultiPagePdfBuffer();
      const doc = await extractPDF(buffer, { originalFilename: "two_page_paper.pdf" });

      expect(doc.pages).toHaveLength(2);
      expect(doc.pages[0].pageNumber).toBe(1);
      expect(doc.pages[1].pageNumber).toBe(2);
      expect(doc.pages[0].pageNumber).not.toBe(0);
    });

    it("validates that all report citations point to existing pages within total page count", () => {
      const totalPages = mockReport.overview.totalPages;
      const allCitations: number[] = [];

      // Collect citations across all sections
      mockReport.researchObjectives.forEach((obj) => allCitations.push(...obj.pageReferences));
      mockReport.keyFindings.forEach((kf) => allCitations.push(...kf.pageReferences));
      mockReport.detailedAnalysis.forEach((da) => allCitations.push(...da.pageReferences));
      allCitations.push(...mockReport.methodologyAssessment.pageReferences);
      mockReport.importantConcepts.forEach((c) => allCitations.push(...c.pageReferences));

      expect(allCitations.length).toBeGreaterThan(0);
      for (const pageNum of allCitations) {
        expect(pageNum).toBeGreaterThanOrEqual(1);
        expect(pageNum).toBeLessThanOrEqual(totalPages);
      }
    });

    it("verifies evidenceSource distinction between document groundings and interpretations", () => {
      for (const finding of mockReport.keyFindings) {
        expect(["from_document", "retrieved_source", "ai_interpretation", "not_established"]).toContain(
          finding.evidenceSource
        );
        if (finding.evidenceSource === "from_document") {
          expect(finding.pageReferences.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("3. Long Document Budgeting (>60,000 Chars) & Strategic Sampling", () => {
    it("correctly triggers strategic sampling when total text exceeds 60,000 characters", () => {
      const pages: ExtractedPage[] = [];
      // Create 30 pages of 3,000 characters each = 90,000 characters (> 60,000 budget)
      for (let i = 1; i <= 30; i++) {
        pages.push({
          pageNumber: i,
          text: `Page ${i} content `.repeat(200),
          charCount: 3000,
          wordCount: 400,
        });
      }

      const longDoc: ExtractedDocument = {
        metadata: {
          id: "doc_long_qa",
          originalFilename: "long_thesis.pdf",
          sanitizedFilename: "long_thesis.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 200000,
          pageCount: 30,
          totalWordCount: 12000,
          totalCharCount: 90000,
          isScanned: false,
          ocrRequired: false,
          isEncrypted: false,
          uploadedAt: new Date().toISOString(),
        },
        pages,
        fullText: pages.map((p) => p.text).join("\n"),
      };

      const budgeted = budgetDocumentPages(longDoc, DEFAULT_MAX_CHAR_BUDGET);

      expect(budgeted.isPartialCoverage).toBe(true);
      expect(budgeted.coveragePercentage).toBeLessThan(100);
      expect(budgeted.totalCharsUsed).toBeLessThanOrEqual(DEFAULT_MAX_CHAR_BUDGET);

      // Verify Priority Sampling:
      // Opening pages (1, 2, 3) must be included
      expect(budgeted.analyzedPages).toContain(1);
      expect(budgeted.analyzedPages).toContain(2);
      expect(budgeted.analyzedPages).toContain(3);

      // Concluding pages (29, 30) must be included
      expect(budgeted.analyzedPages).toContain(29);
      expect(budgeted.analyzedPages).toContain(30);

      // Coverage note must transparently communicate partial coverage
      expect(budgeted.coverageNote).toContain("Analyzed");
      expect(budgeted.coverageNote).toContain("coverage");
    });
  });

  describe("4. Scanned / Image-Only PDF Detection & Safeguards", () => {
    it("detects image-only PDF, sets ocrRequired, and blocks analysis with 422 OCR_REQUIRED", async () => {
      const buffer = createScannedNoTextPdfBuffer();
      const doc = await extractPDF(buffer, { originalFilename: "scanned_invoice.pdf" });

      expect(doc.metadata.isScanned).toBe(true);
      expect(doc.metadata.ocrRequired).toBe(true);

      await documentStore.save(doc);

      const request = new NextRequest(`http://localhost/api/documents/${doc.metadata.id}/analyze`, {
        method: "POST",
      });

      const response = await analyzeRoute(request, {
        params: Promise.resolve({ id: doc.metadata.id }),
      });

      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("OCR_REQUIRED");
      expect(json.error.message).toContain("Optical Character Recognition (OCR)");
    });
  });

  describe("5. System Health & Regression Verification", () => {
    it("verifies health check reports phase and openai provider", async () => {
      const response = await healthRoute();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.phase).toBeGreaterThanOrEqual(4);
      expect(json.data.provider).toBe("openai");
      expect(json.data.status).toBe("healthy");
    });

    it("verifies topic analysis regression works seamlessly", async () => {
      const request = new NextRequest("http://localhost/api/research/analyze-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "Deep learning transformer scaling laws" }),
      });

      const response = await topicRoute(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Synthetic Topic Analysis QA");
    });
  });
});
