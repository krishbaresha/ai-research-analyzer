import { z } from "zod";

/**
 * Server-only environment variables schema.
 * All variables here are validated on the server.
 */
export const serverEnvSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required on the server").optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  GROQ_FALLBACK_MODEL: z.string().default("openai/gpt-oss-20b"),
  MAX_UPLOAD_SIZE_BYTES: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default("10485760"), // 10MB
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates server environment and returns clean sanitized configuration.
 * Never prints secret values.
 */
export function getServerConfig() {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errorIssues = result.error.issues.map((i) => i.path.join(".")).join(", ");
    console.warn(`[Config Warning] Non-critical environment issues: ${errorIssues}`);
  }

  const parsed = result.success ? result.data : serverEnvSchema.parse({});

  return {
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    model: parsed.GROQ_MODEL,
    fallbackModel: parsed.GROQ_FALLBACK_MODEL,
    maxUploadSizeBytes: parsed.MAX_UPLOAD_SIZE_BYTES,
    nodeEnv: parsed.NODE_ENV,
  };
}
