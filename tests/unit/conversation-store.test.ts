import { describe, it, expect, beforeEach } from "vitest";
import { conversationStore } from "@/lib/storage/conversation-store";
import { ChatUserMessage, ChatAssistantMessage } from "@/types/chat";

describe("Conversation Store (Unit)", () => {
  beforeEach(async () => {
    await conversationStore.clear();
  });

  it("creates a new session with unique ID and timestamps", async () => {
    const session = await conversationStore.createSession("doc_test_123");

    expect(session.id).toMatch(/^conv_\d+_/);
    expect(session.documentId).toBe("doc_test_123");
    expect(session.messages).toEqual([]);
    expect(session.createdAt).toBeDefined();
    expect(session.updatedAt).toBeDefined();
  });

  it("retrieves an existing session by ID and returns null for non-existent session", async () => {
    const created = await conversationStore.createSession("doc_test_123");
    const retrieved = await conversationStore.getSession(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);

    const nonExistent = await conversationStore.getSession("conv_does_not_exist");
    expect(nonExistent).toBeNull();
  });

  it("adds user and assistant messages maintaining chronological order", async () => {
    const session = await conversationStore.createSession("doc_test_123");

    const userMsg: ChatUserMessage = {
      id: "msg_user_1",
      role: "user",
      content: "What is the core contribution?",
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: ChatAssistantMessage = {
      id: "msg_ast_1",
      role: "assistant",
      answer: "The paper contributes a block-sparse kernel.",
      evidenceStatus: "supported",
      claims: [
        {
          statement: "Block-sparse kernel reduces memory bandwidth.",
          pageReferences: [2],
          evidenceStatus: "from_document",
        },
      ],
      sources: [
        {
          pageNumber: 2,
          relevanceReason: "Details the kernel architecture.",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    await conversationStore.addMessage(session.id, userMsg);
    await conversationStore.addMessage(session.id, assistantMsg);

    const updated = await conversationStore.getSession(session.id);
    expect(updated?.messages).toHaveLength(2);
    expect(updated?.messages[0].role).toBe("user");
    expect(updated?.messages[1].role).toBe("assistant");
  });

  it("enforces bounded message history ceiling (max 20 messages)", async () => {
    const session = await conversationStore.createSession("doc_test_123");

    // Add 25 messages
    for (let i = 1; i <= 25; i++) {
      const msg: ChatUserMessage = {
        id: `msg_${i}`,
        role: "user",
        content: `Message ${i}`,
        createdAt: new Date().toISOString(),
      };
      await conversationStore.addMessage(session.id, msg);
    }

    const updated = await conversationStore.getSession(session.id);
    expect(updated?.messages).toHaveLength(20);
    // Oldest messages (1-5) must have been evicted, retaining 6-25
    expect((updated?.messages[0] as ChatUserMessage).content).toBe("Message 6");
    expect((updated?.messages[19] as ChatUserMessage).content).toBe("Message 25");
  });

  it("clears messages from a session while preserving session ID and document association", async () => {
    const session = await conversationStore.createSession("doc_test_123");
    await conversationStore.addMessage(session.id, {
      id: "msg_1",
      role: "user",
      content: "Hello",
      createdAt: new Date().toISOString(),
    });

    const success = await conversationStore.clearSession(session.id);
    expect(success).toBe(true);

    const updated = await conversationStore.getSession(session.id);
    expect(updated?.messages).toHaveLength(0);
    expect(updated?.documentId).toBe("doc_test_123");
  });

  it("deletes a session completely", async () => {
    const session = await conversationStore.createSession("doc_test_123");
    const deleted = await conversationStore.deleteSession(session.id);

    expect(deleted).toBe(true);
    const retrieved = await conversationStore.getSession(session.id);
    expect(retrieved).toBeNull();
  });
});
