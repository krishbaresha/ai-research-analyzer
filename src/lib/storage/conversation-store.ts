import { ConversationSession, ChatMessage } from "@/types/chat";

export interface ConversationStore {
  createSession(documentId: string): Promise<ConversationSession>;
  getSession(id: string): Promise<ConversationSession | null>;
  addMessage(conversationId: string, message: ChatMessage): Promise<ConversationSession | null>;
  clearSession(conversationId: string): Promise<boolean>;
  deleteSession(conversationId: string): Promise<boolean>;
  getSessionsForDocument(documentId: string): Promise<ConversationSession[]>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 20;

/**
 * In-Memory Conversation Store.
 * Ephemeral session storage for Phase 5 Document Chat, adhering to ADR-004.
 * Note: Sessions are stored in memory and reset upon server restart.
 */
class InMemoryConversationStore implements ConversationStore {
  private sessions = new Map<string, ConversationSession>();

  async createSession(documentId: string): Promise<ConversationSession> {
    // Evict oldest session if capacity reached
    if (this.sessions.size >= MAX_SESSIONS) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) {
        this.sessions.delete(oldestKey);
      }
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const session: ConversationSession = {
      id,
      documentId,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<ConversationSession | null> {
    return this.sessions.get(id) || null;
  }

  async addMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<ConversationSession | null> {
    const session = this.sessions.get(conversationId);
    if (!session) return null;

    session.messages.push(message);

    // Keep bounded history to prevent unbounded memory growth
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }

    session.updatedAt = new Date().toISOString();
    this.sessions.set(conversationId, session);
    return session;
  }

  async clearSession(conversationId: string): Promise<boolean> {
    const session = this.sessions.get(conversationId);
    if (!session) return false;

    session.messages = [];
    session.updatedAt = new Date().toISOString();
    return true;
  }

  async deleteSession(conversationId: string): Promise<boolean> {
    return this.sessions.delete(conversationId);
  }

  async getSessionsForDocument(documentId: string): Promise<ConversationSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.documentId === documentId
    );
  }

  async clear(): Promise<void> {
    this.sessions.clear();
  }

  async count(): Promise<number> {
    return this.sessions.size;
  }
}

// Global singleton instance for Node runtime
const globalForConversationStore = globalThis as unknown as {
  conversationStoreInstance?: ConversationStore;
};

export const conversationStore =
  globalForConversationStore.conversationStoreInstance ??
  new InMemoryConversationStore();

if (process.env.NODE_ENV !== "production") {
  globalForConversationStore.conversationStoreInstance = conversationStore;
}
