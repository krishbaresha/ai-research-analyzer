export type ChatRole = "user" | "assistant" | "system";

export interface CitationReference {
  pageNumber?: number;
  snippet: string;
  sourceTitle?: string;
  relevanceScore?: number;
}

export interface ChatMessageItem {
  id: string;
  projectId?: string;
  documentId?: string;
  role: ChatRole;
  content: string;
  grounded?: boolean;
  citations?: CitationReference[];
  createdAt: string;
}
