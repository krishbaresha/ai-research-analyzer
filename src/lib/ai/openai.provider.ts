import OpenAI from "openai";
import {
  AIProvider,
  AIProviderResult,
  TopicAnalysisOptions,
  DocumentAnalysisOptions,
  DocumentChatOptions,
  AIAuthError,
  AIRateLimitError,
  AIQuotaExceededError,
  AITimeoutError,
  AIServiceError,
} from "./provider";
import {
  TOPIC_ANALYSIS_SYSTEM_INSTRUCTION,
  buildTopicAnalysisPrompt,
  DOCUMENT_ANALYSIS_SYSTEM_INSTRUCTION,
  buildDocumentAnalysisPrompt,
  DOCUMENT_CHAT_SYSTEM_INSTRUCTION,
  buildDocumentChatPrompt,
} from "./prompts";
import {
  parseAndValidateReport,
  parseAndValidateDocumentReport,
  parseAndValidateChatResponse,
} from "./parsers";
import { ResearchReport, DocumentAnalysisReport } from "@/types/research";
import { ResearchExplorerData } from "@/types/research-explorer";
import { ChatAssistantMessage } from "@/types/chat";
import {
  RESEARCH_EXPLORER_SYSTEM_INSTRUCTION,
  buildResearchExplorerPrompt,
} from "./explorer-prompts";
import { parseAndValidateResearchExplorer } from "./explorer-parsers";
import { budgetDocumentPages } from "../pdf/budgeter";
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
      timeout: 90000, // 90s timeout for academic documents
    });

    return this.client;
  }

  /**
   * Generates a structured academic research analysis for a topic using OpenAI's Responses API.
   */
  async analyzeTopic(
    options: TopicAnalysisOptions
  ): Promise<AIProviderResult<ResearchReport>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const prompt = buildTopicAnalysisPrompt(options);
    const startTime = Date.now();

    try {
      let outputText = "";

      try {
        const response = await client.responses.create({
          model,
          instructions: TOPIC_ANALYSIS_SYSTEM_INSTRUCTION,
          input: prompt,
        });

        if (response.output_text) {
          outputText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
          for (const item of response.output) {
            if ("content" in item && typeof item.content === "string") {
              outputText += item.content;
            } else if ("text" in item && typeof item.text === "string") {
              outputText += item.text;
            }
          }
        }
      } catch (responsesApiError: unknown) {
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
   * Generates a fully grounded academic analysis report of an uploaded PDF document.
   */
  async analyzeDocument(
    options: DocumentAnalysisOptions
  ): Promise<AIProviderResult<DocumentAnalysisReport>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const startTime = Date.now();

    const { document, documentId, focusArea } = options;

    // Step 1: Budget extracted pages to fit comfortably within the context window
    const budgeted = budgetDocumentPages(document);

    if (budgeted.passages.length === 0) {
      throw new AIServiceError(
        "Cannot analyze document: No extractable text was found on any page. If this is a scanned document, OCR is required.",
        "EMPTY_DOCUMENT_TEXT",
        422
      );
    }

    // Step 2: Build defensive XML prompt containing bounded passages
    const prompt = buildDocumentAnalysisPrompt(
      budgeted,
      documentId,
      document.metadata.originalFilename,
      document.metadata.totalWordCount,
      focusArea
    );

    try {
      let outputText = "";

      try {
        const response = await client.responses.create({
          model,
          instructions: DOCUMENT_ANALYSIS_SYSTEM_INSTRUCTION,
          input: prompt,
        });

        if (response.output_text) {
          outputText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
          for (const item of response.output) {
            if ("content" in item && typeof item.content === "string") {
              outputText += item.content;
            } else if ("text" in item && typeof item.text === "string") {
              outputText += item.text;
            }
          }
        }
      } catch (responsesApiError: unknown) {
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
              { role: "system", content: DOCUMENT_ANALYSIS_SYSTEM_INSTRUCTION },
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
          "OpenAI returned an empty response for document analysis.",
          "AI_EMPTY_RESPONSE",
          502
        );
      }

      // Step 3: Validate output against DocumentAnalysisReport schema
      const report = parseAndValidateDocumentReport(
        outputText,
        model,
        documentId,
        budgeted,
        document.metadata.originalFilename,
        document.metadata.totalWordCount
      );

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
   * Generates a grounded, evidence-backed answer to a user's question regarding an uploaded PDF.
   */
  async chatDocument(
    options: DocumentChatOptions
  ): Promise<AIProviderResult<ChatAssistantMessage>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const startTime = Date.now();

    const prompt = buildDocumentChatPrompt({
      userMessage: options.userMessage,
      retrievedPassages: options.retrievedPassages,
      conversationHistory: options.conversationHistory,
      documentTitle: options.document.metadata.originalFilename,
      originalFilename: options.document.metadata.originalFilename,
    });

    try {
      let outputText = "";

      try {
        const response = await client.responses.create({
          model,
          instructions: DOCUMENT_CHAT_SYSTEM_INSTRUCTION,
          input: prompt,
        });

        if (response.output_text) {
          outputText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
          for (const item of response.output) {
            if ("content" in item && typeof item.content === "string") {
              outputText += item.content;
            } else if ("text" in item && typeof item.text === "string") {
              outputText += item.text;
            }
          }
        }
      } catch (responsesApiError: unknown) {
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
              { role: "system", content: DOCUMENT_CHAT_SYSTEM_INSTRUCTION },
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
          "OpenAI returned an empty response for document chat.",
          "AI_EMPTY_RESPONSE",
          502
        );
      }

      const validated = parseAndValidateChatResponse(outputText);
      const processingTimeMs = Date.now() - startTime;

      return {
        data: validated,
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
   * Generates an exhaustive Research Explorer breakdown of an uploaded document.
   */
  async exploreDocument(
    options: DocumentAnalysisOptions
  ): Promise<AIProviderResult<ResearchExplorerData>> {
    const client = this.getClient();
    const model = this.defaultModel;
    const startTime = Date.now();

    const { document, documentId, focusArea } = options;

    const budgeted = budgetDocumentPages(document);
    if (budgeted.passages.length === 0) {
      throw new AIServiceError(
        "Cannot explore document: No extractable text was found on any page. If this is a scanned document, OCR is required.",
        "EMPTY_DOCUMENT_TEXT",
        422
      );
    }

    const prompt = buildResearchExplorerPrompt(
      budgeted,
      document.metadata,
      focusArea
    );

    try {
      let outputText = "";

      try {
        const response = await client.responses.create({
          model,
          instructions: RESEARCH_EXPLORER_SYSTEM_INSTRUCTION,
          input: prompt,
        });

        if (response.output_text) {
          outputText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
          for (const item of response.output) {
            if ("content" in item && typeof item.content === "string") {
              outputText += item.content;
            } else if ("text" in item && typeof item.text === "string") {
              outputText += item.text;
            }
          }
        }
      } catch (responsesApiError: unknown) {
        const errorMsg =
          responsesApiError instanceof Error
            ? responsesApiError.message.toLowerCase()
            : String(responsesApiError).toLowerCase();

        if (
          errorMsg.includes("404") ||
          errorMsg.includes("not found") ||
          errorMsg.includes("unrecognized request") ||
          errorMsg.includes("responses is not a function")
        ) {
          const chatResponse = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: RESEARCH_EXPLORER_SYSTEM_INSTRUCTION },
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
          "OpenAI returned an empty response. Please retry.",
          "AI_EMPTY_RESPONSE",
          502
        );
      }

      const explorerData = parseAndValidateResearchExplorer(
        outputText,
        model,
        documentId,
        document.metadata
      );

      const processingTimeMs = Date.now() - startTime;

      return {
        data: explorerData,
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
