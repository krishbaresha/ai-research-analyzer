import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, DELETE } from "@/app/api/documents/[id]/chat/route";
import { documentStore } from "@/lib/storage/document-store";
import { conversationStore } from "@/lib/storage/conversation-store";
import { ExtractedDocument } from "@/types/document";

const mockChatDocument = vi.fn();

vi.mock("@/lib/ai", () => {
  return {
    getAIProvider: () => ({
      name: "openai",
      defaultModel: "gpt-4o-mini",
      chatDocument: mockChatDocument,
    }),
  };
});

describe("Document Chat Integration (POST /api/documents/[id]/chat)", () => {
  const sampleDocument: ExtractedDocument = {
    metadata: {
      id: "doc_chat_int_1",
      originalFilename: "mamba_vs_transformer.pdf",
      sanitizedFilename: "mamba_vs_transformer.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 2048,
      pageCount: 3,
      totalWordCount: 450,
      totalCharCount: 2800,
      isScanned: false,
      ocrRequired: false,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
    },
    pages: [
      {
        pageNumber: 1,
        text: "Introduction: State space models like Mamba achieve linear O(N) scaling for sequence modeling.",
        charCount: 95,
        wordCount: 14,
      },
      {
        pageNumber: 2,
        text: "Empirical Benchmarks: On language modeling tasks, Mamba matches Transformer quality with 5x higher inference throughput.",
        charCount: 120,
        wordCount: 17,
      },
      {
        pageNumber: 3,
        text: "Conclusion: State space duality offers a promising direction for processing long context documents.",
        charCount: 100,
        wordCount: 14,
      },
    ],
    fullText: "Page 1...\nPage 2...\nPage 3...",
  };

  beforeEach(async () => {
    await documentStore.clear();
    await conversationStore.clear();
    mockChatDocument.mockReset();
  });

  it("creates a new conversation session and returns grounded assistant answer", async () => {
    await documentStore.save(sampleDocument);

    mockChatDocument.mockResolvedValueOnce({
      data: {
        id: "msg_ast_1",
        role: "assistant",
        answer: "Mamba achieves linear O(N) scaling for sequence modeling.",
        evidenceStatus: "supported",
        claims: [
          {
            statement: "Mamba scales with linear O(N) complexity.",
            pageReferences: [1],
            evidenceStatus: "from_document",
          },
        ],
        sources: [
          {
            pageNumber: 1,
            relevanceReason: "States linear complexity in the introduction.",
            excerpt: "achieve linear O(N) scaling",
          },
        ],
        createdAt: new Date().toISOString(),
      },
      rawOutput: "{}",
      modelUsed: "gpt-4o-mini",
      processingTimeMs: 140,
    });

    const req = new NextRequest("http://localhost:3000/api/documents/doc_chat_int_1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is the computational complexity of Mamba?",
      }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "doc_chat_int_1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.conversationId).toMatch(/^conv_/);
    expect(json.data.message.role).toBe("assistant");
    expect(json.data.message.evidenceStatus).toBe("supported");
    expect(json.data.message.claims[0].pageReferences).toEqual([1]);
    expect(json.data.retrieval.pagesSearched).toBe(3);
    expect(json.data.retrieval.pagesUsed).toContain(1);

    // Verify session was persisted in conversationStore
    const session = await conversationStore.getSession(json.data.conversationId);
    expect(session).not.toBeNull();
    expect(session?.messages).toHaveLength(2); // 1 user + 1 assistant
  });

  it("continues an existing conversation using conversationId", async () => {
    await documentStore.save(sampleDocument);
    const session = await conversationStore.createSession("doc_chat_int_1");

    mockChatDocument.mockResolvedValueOnce({
      data: {
        id: "msg_ast_2",
        role: "assistant",
        answer: "Mamba demonstrates 5x higher inference throughput on page 2.",
        evidenceStatus: "supported",
        claims: [
          {
            statement: "5x higher inference throughput compared to transformers.",
            pageReferences: [2],
            evidenceStatus: "from_document",
          },
        ],
        sources: [
          {
            pageNumber: 2,
            relevanceReason: "Benchmark results on throughput.",
          },
        ],
        createdAt: new Date().toISOString(),
      },
      rawOutput: "{}",
      modelUsed: "gpt-4o-mini",
      processingTimeMs: 130,
    });

    const req = new NextRequest("http://localhost:3000/api/documents/doc_chat_int_1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What about inference throughput?",
        conversationId: session.id,
      }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "doc_chat_int_1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.conversationId).toBe(session.id);
    expect(mockChatDocument).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when document does not exist", async () => {
    const req = new NextRequest("http://localhost:3000/api/documents/doc_missing/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "doc_missing" }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 when conversation session belongs to a different document", async () => {
    await documentStore.save(sampleDocument);
    const otherSession = await conversationStore.createSession("doc_other_different");

    const req = new NextRequest("http://localhost:3000/api/documents/doc_chat_int_1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello",
        conversationId: otherSession.id,
      }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "doc_chat_int_1" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("BAD_REQUEST");
    expect(json.error.message).toContain("does not belong to the requested document");
  });

  it("returns 422 with OCR_REQUIRED for scanned PDF", async () => {
    const scannedDoc: ExtractedDocument = {
      ...sampleDocument,
      metadata: {
        ...sampleDocument.metadata,
        id: "doc_scanned_chat",
        isScanned: true,
        ocrRequired: true,
        totalCharCount: 0,
      },
      pages: [],
    };
    await documentStore.save(scannedDoc);

    const req = new NextRequest("http://localhost:3000/api/documents/doc_scanned_chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What does this say?" }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "doc_scanned_chat" }),
    });

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("OCR_REQUIRED");
  });

  it("DELETE clears conversation history", async () => {
    await documentStore.save(sampleDocument);
    const session = await conversationStore.createSession("doc_chat_int_1");
    await conversationStore.addMessage(session.id, {
      id: "msg_1",
      role: "user",
      content: "Hello",
      createdAt: new Date().toISOString(),
    });

    const req = new NextRequest(
      `http://localhost:3000/api/documents/doc_chat_int_1/chat?conversationId=${session.id}`,
      { method: "DELETE" }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: "doc_chat_int_1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.cleared).toBe(true);

    const updated = await conversationStore.getSession(session.id);
    expect(updated?.messages).toHaveLength(0);
  });
});
