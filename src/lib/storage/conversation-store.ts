import { ConversationSession, ChatMessage } from "@/types/chat";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase/config";
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, query, where } from "firebase/firestore";

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

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Hybrid Conversation Store with Cloud Firestore persistence.
 * Persists chat sessions and message histories to Firebase Firestore,
 * maintaining session state across serverless function restarts.
 */
class HybridConversationStore implements ConversationStore {
  private cache = new Map<string, ConversationSession>();

  async createSession(documentId: string): Promise<ConversationSession> {
    // Evict oldest session if capacity reached
    if (this.cache.size >= MAX_SESSIONS) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
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

    this.cache.set(id, session);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "chat_sessions", id);
          await setDoc(docRef, cleanForFirestore(session));
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to create session in Firebase:", err);
      }
    }

    return session;
  }

  async getSession(id: string): Promise<ConversationSession | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "chat_sessions", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as ConversationSession;
            this.cache.set(id, data);
            return data;
          }
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to get session from Firebase:", err);
      }
    }

    return null;
  }

  async addMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<ConversationSession | null> {
    const session = await this.getSession(conversationId);
    if (!session) return null;

    session.messages.push(message);

    // Keep bounded history to prevent unbounded memory growth
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }

    session.updatedAt = new Date().toISOString();
    this.cache.set(conversationId, session);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "chat_sessions", conversationId);
          await setDoc(docRef, cleanForFirestore(session));
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to update session in Firebase:", err);
      }
    }

    return session;
  }

  async clearSession(conversationId: string): Promise<boolean> {
    const session = await this.getSession(conversationId);
    if (!session) return false;

    session.messages = [];
    session.updatedAt = new Date().toISOString();
    this.cache.set(conversationId, session);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "chat_sessions", conversationId);
          await setDoc(docRef, cleanForFirestore(session));
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to clear session in Firebase:", err);
      }
    }

    return true;
  }

  async deleteSession(conversationId: string): Promise<boolean> {
    const wasInCache = this.cache.delete(conversationId);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "chat_sessions", conversationId);
          await deleteDoc(docRef);
          return true;
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to delete session in Firebase:", err);
      }
    }

    return wasInCache;
  }

  async getSessionsForDocument(documentId: string): Promise<ConversationSession[]> {
    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const colRef = collection(db, "chat_sessions");
          const q = query(colRef, where("documentId", "==", documentId));
          const snap = await getDocs(q);
          const list: ConversationSession[] = [];
          snap.forEach((d) => {
            const data = d.data() as ConversationSession;
            if (data) {
              list.push(data);
              this.cache.set(data.id, data);
            }
          });
          if (list.length > 0) return list;
        }
      } catch (err) {
        console.warn("[Firestore ConversationStore] Failed to query sessions from Firebase:", err);
      }
    }

    return Array.from(this.cache.values()).filter(
      (s) => s.documentId === documentId
    );
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async count(): Promise<number> {
    return this.cache.size;
  }
}

// Global singleton instance for Node runtime
const globalForConversationStore = globalThis as unknown as {
  conversationStoreInstance?: ConversationStore;
};

export const conversationStore =
  globalForConversationStore.conversationStoreInstance ??
  new HybridConversationStore();

if (process.env.NODE_ENV !== "production") {
  globalForConversationStore.conversationStoreInstance = conversationStore;
}
