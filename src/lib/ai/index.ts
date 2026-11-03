import { AIProvider } from "./provider";
import { OpenAIProvider } from "./openai.provider";

export * from "./provider";
export * from "./prompts";
export * from "./parsers";
export * from "./openai.provider";

let defaultProviderInstance: AIProvider | null = null;

/**
 * Returns the configured AIProvider singleton.
 * Can be swapped with another provider without modifying business logic.
 */
export function getAIProvider(modelOverride?: string): AIProvider {
  if (!defaultProviderInstance || modelOverride) {
    defaultProviderInstance = new OpenAIProvider(modelOverride);
  }
  return defaultProviderInstance;
}
