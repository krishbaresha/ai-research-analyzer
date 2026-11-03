import { describe, it, expect } from "vitest";
import { sanitizeModelJsonString, parseAndValidateReport } from "@/lib/ai/parsers";
import { AIResponseParseError } from "@/lib/ai/provider";
import mockReport from "../fixtures/mock-openai-report.json";

describe("Model JSON Sanitizer", () => {
  it("strips markdown json fences cleanly", () => {
    const raw = "```json\n{\"test\": true}\n```";
    expect(sanitizeModelJsonString(raw)).toBe("{\"test\": true}");
  });

  it("handles text without fences unchanged", () => {
    const raw = "{\"hello\": \"world\"}";
    expect(sanitizeModelJsonString(raw)).toBe(raw);
  });

  it("handles whitespace and newlines around fences", () => {
    const raw = "  ```json\n  {\"key\": 123}  \n```  ";
    expect(sanitizeModelJsonString(raw)).toBe("{\"key\": 123}");
  });
});

describe("Report Parser and Validator", () => {
  it("successfully parses valid report JSON", () => {
    const jsonString = JSON.stringify(mockReport);
    const parsed = parseAndValidateReport(jsonString, "gpt-4o-mini");

    expect(parsed.title).toBe(mockReport.title);
    expect(parsed.executiveSummary).toBe(mockReport.executiveSummary);
    expect(parsed.keyFindings).toHaveLength(3);
    expect(parsed.keyFindings[0].evidenceSource).toBe("ai_interpretation");
    expect(parsed.evidenceStatus).toBe("ai_interpretation");
  });

  it("throws AIResponseParseError for malformed JSON string", () => {
    const invalidJson = "{ title: 'missing quotes', executiveSummary: ";

    expect(() => parseAndValidateReport(invalidJson, "gpt-4o-mini")).toThrow(
      AIResponseParseError
    );
  });

  it("throws AIResponseParseError when required fields are missing", () => {
    const incomplete = JSON.stringify({
      title: "Incomplete Report",
      // missing executiveSummary, keyFindings, conclusion
    });

    expect(() => parseAndValidateReport(incomplete, "gpt-4o-mini")).toThrow(
      AIResponseParseError
    );
  });

  it("rejects reports with empty keyFindings array", () => {
    const noFindings = JSON.stringify({
      ...mockReport,
      keyFindings: [],
    });

    expect(() => parseAndValidateReport(noFindings, "gpt-4o-mini")).toThrow(
      AIResponseParseError
    );
  });
});
