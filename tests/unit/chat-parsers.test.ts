import { describe, it, expect } from "vitest";
import { parseAndValidateChatResponse } from "@/lib/ai/parsers";
import { AIResponseParseError } from "@/lib/ai/provider";

describe("Document Chat Parsers (Unit)", () => {
  it("parses valid JSON response conforming to chat assistant schema", () => {
    const raw = JSON.stringify({
      answer: "The study evaluates FlashAttention against BERT-large.",
      evidenceStatus: "supported",
      claims: [
        {
          statement: "FlashAttention achieves 2.4x speedup on BERT.",
          pageReferences: [3],
          evidenceStatus: "from_document",
        },
      ],
      sources: [
        {
          pageNumber: 3,
          relevanceReason: "Reports empirical benchmarks on BERT.",
          excerpt: "2.4x speedup observed.",
        },
      ],
    });

    const parsed = parseAndValidateChatResponse(raw);

    expect(parsed.role).toBe("assistant");
    expect(parsed.answer).toContain("FlashAttention against BERT-large");
    expect(parsed.evidenceStatus).toBe("supported");
    expect(parsed.claims).toHaveLength(1);
    expect(parsed.claims[0].pageReferences).toEqual([3]);
    expect(parsed.sources[0].pageNumber).toBe(3);
  });

  it("strips markdown code fences from model output", () => {
    const raw = `\`\`\`json
{
  "answer": "The paper does not mention quantum annealing.",
  "evidenceStatus": "not_found",
  "claims": [],
  "sources": []
}
\`\`\``;

    const parsed = parseAndValidateChatResponse(raw);

    expect(parsed.evidenceStatus).toBe("not_found");
    expect(parsed.answer).toContain("does not mention quantum annealing");
    expect(parsed.claims).toEqual([]);
    expect(parsed.sources).toEqual([]);
  });

  it("coerces single page numbers into number arrays for claims", () => {
    const raw = JSON.stringify({
      answer: "Tiling is used on page 2.",
      evidenceStatus: "supported",
      claims: [
        {
          statement: "Tiling divides matrices into blocks.",
          pageReferences: 2, // single number instead of array
          evidenceStatus: "from_document",
        },
      ],
      sources: [
        {
          pageNumber: 2,
          relevanceReason: "Explains tiling methodology.",
        },
      ],
    });

    const parsed = parseAndValidateChatResponse(raw);
    expect(parsed.claims[0].pageReferences).toEqual([2]);
  });

  it("throws AIResponseParseError on invalid JSON syntax", () => {
    expect(() => parseAndValidateChatResponse("{ broken json: ")).toThrow(
      AIResponseParseError
    );
  });

  it("throws AIResponseParseError on missing required fields", () => {
    const missingAnswer = JSON.stringify({
      evidenceStatus: "supported",
      claims: [],
      sources: [],
    });

    expect(() => parseAndValidateChatResponse(missingAnswer)).toThrow(
      AIResponseParseError
    );
  });
});
