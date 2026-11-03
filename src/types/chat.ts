export type ChatRole = "user" | "assistant" | "system";

export type ChatEvidenceStatus =
  | "supported"
  | "partially_supported"
  | "not_found"
  | "interpretation";

export interface ChatClaimItem {
  statement: string;
  pageReferences: number[];
  evidenceStatus: "from_document" | "ai_interpretation" | "not_established";
}

export interface ChatSourceItem {
  pageNumber: number;
  relevanceReason: string;
  excerpt?: string;
}

export interface ChatAssistantMessage {
  id: string;
  role: "assistant";
  answer: string;
  evidenceStatus: ChatEvidenceStatus;
  claims: ChatClaimItem[];
  sources: ChatSourceItem[];
  createdAt: string;
}

export interface ChatUserMessage {
  id: string;
  role: "user";
  content: string;
  createdAt: string;
}

export type ChatMessage = ChatUserMessage | ChatAssistantMessage;

export interface ChatRetrievalInfo {
  pagesSearched: number;
  pagesUsed: number[];
  partialCoverage: boolean;
  totalChunksSearched?: number;
}

export interface ConversationSession {
  id: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
