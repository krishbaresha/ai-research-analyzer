import { describe, it, expect, vi, beforeEach } from "vitest";
import { GroqProvider } from "@/lib/ai/groq.provider";
import {
  AIAuthError,
  AIRateLimitError,
  AIResponseParseError,
} from "@/lib/ai/provider";
import mockReport from "../fixtures/mock-groq-report.json";

// Mock Groq SDK using vi.hoisted
const { MockGroq, MockGroqAPIError, mockCompletionsCreate } = vi.hoisted(() => {
  const mockCompletionsCreate = vi.fn();

  class MockGroqAPIError extends Error {
    public status?: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  }

  class MockGroq {
    public static APIError = MockGroqAPIError;
    public chat = {
      completions: {
        create: mockCompletionsCreate,
      },
    };
  }

  return { MockGroq, MockGroqAPIError, mockCompletionsCreate };
});

vi.mock("groq-sdk", () => {
  return {
    default: MockGroq,
    APIError: MockGroqAPIError,
  };
});

describe("GroqProvider Integration (Mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GROQ_API_KEY;
  });

  it("throws AIAuthError when GROQ_API_KEY is not set", async () => {
    const provider = new GroqProvider();

    await expect(
      provider.analyzeTopic({ topic: "Deep learning transformers" })
    ).rejects.toThrow(AIAuthError);
  });

  it("successfully calls groq.chat.completions.create and parses valid report", async () => {
    process.env.GROQ_API_KEY = "gsk_test_mock_key";
    const provider = new GroqProvider("llama-3.3-70b-versatile");

    mockCompletionsCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockReport),
          },
        },
      ],
    });

    const result = await provider.analyzeTopic({
      topic: "State space models vs transformers",
      scope: "Published 2023-2025",
    });

    expect(result.data.title).toBe(mockReport.title);
    expect(result.data.keyFindings).toHaveLength(3);
    expect(result.modelUsed).toBe("llama-3.3-70b-versatile");
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(mockCompletionsCreate).toHaveBeenCalledTimes(1);
  });

  it("maps 401 error to AIAuthError", async () => {
    process.env.GROQ_API_KEY = "gsk_invalid_key";
    const provider = new GroqProvider();

    mockCompletionsCreate.mockRejectedValueOnce(
      new MockGroqAPIError(401, "Invalid API Key")
    );

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIAuthError);
  });

  it("maps 429 rate limit to AIRateLimitError after retries", async () => {
    process.env.GROQ_API_KEY = "gsk_valid_key";
    const provider = new GroqProvider();

    mockCompletionsCreate.mockRejectedValue(
      new MockGroqAPIError(429, "Rate limit reached for model tokens per minute")
    );

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIRateLimitError);
  }, 10000);

  it("maps malformed model responses to AIResponseParseError", async () => {
    process.env.GROQ_API_KEY = "gsk_valid_key";
    const provider = new GroqProvider();

    mockCompletionsCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Sorry, I cannot produce valid JSON.",
          },
        },
      ],
    });

    await expect(
      provider.analyzeTopic({ topic: "Test topic" })
    ).rejects.toThrow(AIResponseParseError);
  });
});
