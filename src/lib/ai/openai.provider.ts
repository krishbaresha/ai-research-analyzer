import OpenAI from "openai";
import {
  AIProvider,
  AIProviderResult,
  TopicAnalysisOptions,
  AIAuthError,
  AIRateLimitError,
  AIQuotaExceededError,
  AITimeoutError,
  AIServiceError,
} from "./provider";
import { TOPIC_ANALYSIS_SYSTEM_INSTRUCTION, buildTopicAnalysisPrompt } from "./prompts";
import { parseAndValidateReport } from "./parsers";
import { ResearchReport } from "@/types/research";
import { getServerConfig } from "../validation/env.schema";

export class OpenAIProvider implements AIProvider {
  public readonly name = "openai";
  public readonly defaultModel: string;
  private client: OpenAI | null = null;

  constructor(modelOverride?: string) {
    const config = getServerConfig();
    this.defaultModel = modelOverride || config.model || "gpt-4o-mini";
  }

  private getClient(): OpenAI {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new AIAuthError(
        "OPENAI_API_KEY is not configured on the server. Please add your API key to .env.local."
      );
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 60000, // 60s timeout
    });

    return this.client;
  }

  /**
   * Generates a structured academic research analysis using OpenAI's Responses API.
   */
  async analyzeTopic(
    options: TopicAnalysisOptions
  ): Promise<AIProviderResult<ResearchReport>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const prompt = buildTopicAnalysisPrompt(options);
    const startTime = Date.now();

    try {
      // Use OpenAI Responses API: client.responses.create()
      let outputText = "";

      try {
        const response = await client.responses.create({
          model,
          instructions: TOPIC_ANALYSIS_SYSTEM_INSTRUCTION,
          input: prompt,
        });

        // The Responses API provides .output_text directly
        if (response.output_text) {
          outputText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
          // Fallback traversal of output items
          for (const item of response.output) {
            if ("content" in item && typeof item.content === "string") {
              outputText += item.content;
            } else if ("text" in item && typeof item.text === "string") {
              outputText += item.text;
            }
          }
        }
      } catch (responsesApiError: unknown) {
        // Fallback to chat completions if the configured model does not support responses API
        const errorMsg =
          responsesApiError instanceof Error
            ? responsesApiError.message.toLowerCase()
            : "";

        if (
          errorMsg.includes("not supported") ||
          errorMsg.includes("unrecognized request") ||
          errorMsg.includes("responses is not a function")
        ) {
          const chatResponse = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: TOPIC_ANALYSIS_SYSTEM_INSTRUCTION },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          });

          outputText = chatResponse.choices[0]?.message?.content || "";
        } else {
          throw responsesApiError;
        }
      }

      if (!outputText || outputText.trim() === "") {
        throw new AIServiceError(
          "OpenAI returned an empty response. Please verify the prompt or retry.",
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
      if (error instanceof AIServiceError) {
        throw error;
      }

      this.handleOpenAIError(error);
    }
  }

  /**
   * Maps SDK and HTTP exceptions to structured, safe domain errors.
   */
  private handleOpenAIError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      const code = error.code || "";
      const message = error.message.toLowerCase();

      if (status === 401 || message.includes("invalid api key")) {
        throw new AIAuthError(
          "OpenAI authentication failed. The configured OPENAI_API_KEY is invalid."
        );
      }

      if (
        status === 429 ||
        code === "insufficient_quota" ||
        message.includes("quota") ||
        message.includes("credit balance")
      ) {
        if (code === "insufficient_quota" || message.includes("quota")) {
          throw new AIQuotaExceededError();
        }
        throw new AIRateLimitError();
      }

      if (status === 408 || message.includes("timeout")) {
        throw new AITimeoutError();
      }

      throw new AIServiceError(
        `OpenAI error (${status}): ${error.message}`,
        code || "OPENAI_API_ERROR",
        status >= 400 && status < 600 ? status : 500
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AITimeoutError("The request was aborted or timed out.");
    }

    const message = error instanceof Error ? error.message : "An unexpected AI inference error occurred.";
    throw new AIServiceError(message, "AI_UNEXPECTED_ERROR", 500);
  }
}
