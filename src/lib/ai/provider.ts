import { ResearchReport } from "@/types/research";

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, code = "AI_SERVICE_ERROR", status = 500) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AIAuthError extends AIServiceError {
  constructor(message = "OpenAI API key is missing or invalid on the server. Please add your OPENAI_API_KEY to .env.local.") {
    super(message, "AI_AUTH_ERROR", 401);
    this.name = "AIAuthError";
  }
}

export class AIRateLimitError extends AIServiceError {
  constructor(message = "OpenAI API rate limit reached. Please retry after a brief pause.") {
    super(message, "AI_RATE_LIMIT", 429);
    this.name = "AIRateLimitError";
  }
}

export class AIQuotaExceededError extends AIServiceError {
  constructor(
    message = "Your OpenAI account has insufficient credits or exceeded its quota. Please check your billing settings."
  ) {
    super(message, "AI_QUOTA_EXCEEDED", 402);
    this.name = "AIQuotaExceededError";
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(message = "Inference request to OpenAI timed out. Please retry.") {
    super(message, "AI_TIMEOUT", 504);
    this.name = "AITimeoutError";
  }
}

export class AIResponseParseError extends AIServiceError {
  public readonly rawResponse?: string;

  constructor(message = "The model generated malformed output that failed validation.", rawResponse?: string) {
    super(message, "AI_MALFORMED_OUTPUT", 502);
    this.name = "AIResponseParseError";
    this.rawResponse = rawResponse;
  }
}

export interface TopicAnalysisOptions {
  topic: string;
  scope?: string;
  signal?: AbortSignal;
}

export interface AIProviderResult<T> {
  data: T;
  rawOutput?: string;
  modelUsed: string;
  processingTimeMs: number;
}

/**
 * Modular AI Provider interface.
 * Allows switching providers (OpenAI, Anthropic, etc.) without altering business logic.
 */
export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;

  analyzeTopic(options: TopicAnalysisOptions): Promise<AIProviderResult<ResearchReport>>;
}
