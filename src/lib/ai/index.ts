import { AIProvider } from "./provider";
import { GroqProvider } from "./groq.provider";

export * from "./provider";
export * from "./prompts";
export * from "./parsers";
export * from "./groq.provider";
export * from "./openai.provider";

let defaultProviderInstance: AIProvider | null = null;

/**
 * Returns the configured AIProvider singleton.
 * Defaults to GroqProvider for Phase 2, with full modular support for alternative providers.
 */
export function getAIProvider(modelOverride?: string): AIProvider {
  if (!defaultProviderInstance || modelOverride) {
    defaultProviderInstance = new GroqProvider(modelOverride);
  }
  return defaultProviderInstance;
}
