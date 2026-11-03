import { describe, it, expect } from "vitest";
import { parseAndValidateDocumentReport } from "@/lib/ai/parsers";
import { AIResponseParseError } from "@/lib/ai/provider";
import { BudgetedDocument } from "@/lib/pdf/budgeter";
import mockReport from "../fixtures/mock-document-report.json";

describe("Document Report Parser & Schema Validator (Unit)", () => {
  const dummyBudgeted: BudgetedDocument = {
    passages: [{ pageNumber: 1, text: "Sample", charCount: 6, wordCount: 1 }],
    analyzedPages: [1, 2],
    totalPages: 2,
    coveragePercentage: 100,
    isPartialCoverage: false,
    totalCharsUsed: 6,
  };

  it("successfully parses valid document analysis JSON and preserves citations", () => {
    const rawJson = JSON.stringify(mockReport);
    const parsed = parseAndValidateDocumentReport(
      rawJson,
      "gpt-4o-mini",
      "doc_test_456",
      dummyBudgeted,
      "transformer-paper.pdf",
      850
    );

    expect(parsed.documentId).toBe("doc_test_456");
    expect(parsed.modelId).toBe("gpt-4o-mini");
    expect(parsed.keyFindings).toHaveLength(2);
    expect(parsed.keyFindings[0].pageReferences).toEqual([1]);
    expect(parsed.keyFindings[0].quote).toContain("first transduction model");
    expect(parsed.methodologyAssessment.datasetsUsed).toContain("WMT 2014 English-to-German");
    expect(parsed.overview.coveragePercentage).toBe(100);
  });

  it("strips markdown code fences before parsing", () => {
    const fencedJson = `\`\`\`json\n${JSON.stringify(mockReport)}\n\`\`\``;
    const parsed = parseAndValidateDocumentReport(
      fencedJson,
      "gpt-4o-mini",
      "doc_test_456",
      dummyBudgeted,
      "transformer-paper.pdf",
      850
    );

    expect(parsed.documentId).toBe("doc_test_456");
    expect(parsed.overview.title).toBe(mockReport.overview.title);
  });

  it("throws AIResponseParseError when model produces invalid JSON syntax", () => {
    const brokenJson = "{ this is not JSON }";
    expect(() =>
      parseAndValidateDocumentReport(
        brokenJson,
        "gpt-4o-mini",
        "doc_test_456",
        dummyBudgeted,
        "paper.pdf",
        500
      )
    ).toThrow(AIResponseParseError);
  });

  it("throws AIResponseParseError when required fields are missing", () => {
    const incomplete = {
      title: "Incomplete",
      // missing keyFindings, executiveSummary, methodologyAssessment, etc.
    };

    expect(() =>
      parseAndValidateDocumentReport(
        JSON.stringify(incomplete),
        "gpt-4o-mini",
        "doc_test_456",
        dummyBudgeted,
        "paper.pdf",
        500
      )
    ).toThrow(AIResponseParseError);
  });
});
