import { z } from "zod";
import { pageReferencesCoerce } from "./research.schema";

export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Question or message cannot be empty")
    .max(2000, "Message length cannot exceed 2000 characters")
    .trim(),
  conversationId: z.string().nullable().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatClaimItemSchema = z.object({
  statement: z.string().min(1, "Claim statement cannot be empty"),
  pageReferences: pageReferencesCoerce,
  evidenceStatus: z
    .enum(["from_document", "ai_interpretation", "not_established"])
    .default("from_document"),
});

export type ChatClaimItem = z.infer<typeof chatClaimItemSchema>;

export const chatSourceItemSchema = z.object({
  pageNumber: z.number().int().positive("Page number must be positive"),
  relevanceReason: z.string().min(1, "Relevance reason cannot be empty"),
  excerpt: z.string().optional().default(""),
});

export type ChatSourceItem = z.infer<typeof chatSourceItemSchema>;

export const chatAssistantResponseSchema = z.object({
  id: z.string().default(() => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  role: z.literal("assistant").default("assistant"),
  answer: z.string().min(1, "Answer cannot be empty"),
  evidenceStatus: z.enum([
    "supported",
    "partially_supported",
    "not_found",
    "interpretation",
  ]),
  claims: z.array(chatClaimItemSchema).default([]),
  sources: z.array(chatSourceItemSchema).default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedChatAssistantResponse = z.infer<
  typeof chatAssistantResponseSchema
>;
