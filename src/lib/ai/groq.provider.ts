import Groq from "groq-sdk";
import {
  AIProvider,
  AIProviderResult,
  TopicAnalysisOptions,
  AIAuthError,
  AIRateLimitError,
  AITimeoutError,
  AIServiceError,
} from "./provider";
import { TOPIC_ANALYSIS_SYSTEM_INSTRUCTION, buildTopicAnalysisPrompt } from "./prompts";
import { parseAndValidateReport } from "./parsers";
import { ResearchReport } from "@/types/research";
import { getServerConfig } from "../validation/env.schema";

export class GroqProvider implements AIProvider {
  public readonly name = "groq";
  public readonly defaultModel: string;
  private client: Groq | null = null;

  constructor(modelOverride?: string) {
    const config = getServerConfig();
    this.defaultModel = modelOverride || config.model || "llama-3.3-70b-versatile";
  }

  private getClient(): Groq {
    if (this.client) return this.client;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new AIAuthError(
        "GROQ_API_KEY is not configured on the server. Please add your API key to .env.local."
      );
    }

    this.client = new Groq({
      apiKey,
      timeout: 45000, // 45 second timeout
    });

    return this.client;
  }

  /**
   * Generates structured academic research analysis using Groq's high-speed LPU inference.
   */
  async analyzeTopic(
    options: TopicAnalysisOptions
  ): Promise<AIProviderResult<ResearchReport>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const prompt = buildTopicAnalysisPrompt(options);
    const startTime = Date.now();

    const maxRetries = 2;
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: TOPIC_ANALYSIS_SYSTEM_INSTRUCTION,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2, // Low temperature for high factual consistency
        });

        const outputText = response.choices[0]?.message?.content || "";

        if (!outputText || outputText.trim() === "") {
          throw new AIServiceError(
            "Groq returned an empty response. Please verify the prompt or retry.",
            "AI_EMPTY_RESPONSE",
            502
          );
        }

        const report = parseAndValidateReport(outputText, model);
        report.researchQuestion = options.topic;
        if (options.scope) report.scope = options.scope;

        const processingTimeMs = Date.now() - startTime;

        return {
          data: report,
          rawOutput: outputText,
          modelUsed: model,
          processingTimeMs,
        };
      } catch (error: unknown) {
        lastError = error;

        // If it's already a domain error (e.g. AIResponseParseError), don't retry, fail immediately
        if (error instanceof AIServiceError) {
          throw error;
        }

        // Check if error is transient rate limit (429) or server error (503) for backoff retry
        const isRateLimit =
          error instanceof Groq.APIError && (error.status === 429 || error.status === 503);

        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    if (lastError instanceof AIServiceError) {
      throw lastError;
    }

    this.handleGroqError(lastError);
  }

  /**
   * Maps Groq SDK and network exceptions to safe domain errors.
   */
  private handleGroqError(error: unknown): never {
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error instanceof Groq.APIError) {
      const status = error.status || 500;
      const message = error.message.toLowerCase();

      if (status === 401 || message.includes("invalid api key")) {
        throw new AIAuthError(
          "Groq authentication failed. The configured GROQ_API_KEY is invalid."
        );
      }

      if (status === 429 || message.includes("rate limit") || message.includes("tokens per minute")) {
        throw new AIRateLimitError(
          "Groq rate limit reached (TPM/RPM). Please retry in a few moments."
        );
      }

      if (status === 408 || message.includes("timeout")) {
        throw new AITimeoutError();
      }

      throw new AIServiceError(
        `Groq API error (${status}): ${error.message}`,
        "GROQ_API_ERROR",
        status >= 400 && status < 600 ? status : 500
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AITimeoutError("The inference request was aborted or timed out.");
    }

    const message = error instanceof Error ? error.message : "An unexpected AI inference error occurred.";
    throw new AIServiceError(message, "AI_UNEXPECTED_ERROR", 500);
  }
}
