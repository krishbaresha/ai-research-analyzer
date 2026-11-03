import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "@/lib/ai/openai.provider";
import {
  AIAuthError,
  AIRateLimitError,
  AIQuotaExceededError,
  AIResponseParseError,
} from "@/lib/ai/provider";
import mockReport from "../fixtures/mock-openai-report.json";

// Use vi.hoisted so variables are safely hoisted before vi.mock execution
const { MockOpenAI, MockAPIError, mockResponsesCreate } = vi.hoisted(() => {
  const mockResponsesCreate = vi.fn();
  const mockCompletionsCreate = vi.fn();

  class MockAPIError extends Error {
    public status?: number;
    public code?: string;
    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
      this.name = "APIError";
    }
  }

  class MockOpenAI {
    public static APIError = MockAPIError;
    public responses = {
      create: mockResponsesCreate,
    };
    public chat = {
      completions: {
        create: mockCompletionsCreate,
      },
    };
  }

  return { MockOpenAI, MockAPIError, mockResponsesCreate, mockCompletionsCreate };
});

vi.mock("openai", () => {
  return {
    default: MockOpenAI,
    APIError: MockAPIError,
  };
});

describe("OpenAIProvider Integration (Mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it("throws AIAuthError when OPENAI_API_KEY is not set", async () => {
    const provider = new OpenAIProvider();

    await expect(
      provider.analyzeTopic({ topic: "Deep learning transformers" })
    ).rejects.toThrow(AIAuthError);
  });

  it("successfully calls responses.create and parses valid report", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key-mock";
    const provider = new OpenAIProvider("gpt-4o-mini");

    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockReport),
    });

    const result = await provider.analyzeTopic({
      topic: "State space models vs transformers",
      scope: "Published 2023-2025",
    });

    expect(result.data.title).toBe(mockReport.title);
    expect(result.data.keyFindings).toHaveLength(3);
    expect(result.modelUsed).toBe("gpt-4o-mini");
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
  });

  it("maps 401 error to AIAuthError", async () => {
    process.env.OPENAI_API_KEY = "sk-invalid-key";
    const provider = new OpenAIProvider();

    mockResponsesCreate.mockRejectedValueOnce(
      new MockAPIError(401, "Incorrect API key provided")
    );

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIAuthError);
  });

  it("maps 429 insufficient_quota error to AIQuotaExceededError", async () => {
    process.env.OPENAI_API_KEY = "sk-valid-key";
    const provider = new OpenAIProvider();

    mockResponsesCreate.mockRejectedValueOnce(
      new MockAPIError(429, "You exceeded your current quota", "insufficient_quota")
    );

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIQuotaExceededError);
  });

  it("maps 429 standard rate limit to AIRateLimitError", async () => {
    process.env.OPENAI_API_KEY = "sk-valid-key";
    const provider = new OpenAIProvider();

    mockResponsesCreate.mockRejectedValueOnce(
      new MockAPIError(429, "Rate limit reached for requests")
    );

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIRateLimitError);
  });

  it("maps malformed model responses to AIResponseParseError", async () => {
    process.env.OPENAI_API_KEY = "sk-valid-key";
    const provider = new OpenAIProvider();

    mockResponsesCreate.mockResolvedValueOnce({
      output_text: "Sorry, I cannot produce JSON right now.",
    });

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIResponseParseError);
  });
});
