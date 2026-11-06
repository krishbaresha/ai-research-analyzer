import { describe, it, expect } from "vitest";
import { documentStore } from "@/lib/storage/document-store";
import { conversationStore } from "@/lib/storage/conversation-store";
import { ExtractedDocument } from "@/types/document";

describe("Firebase Firestore & Hybrid Storage (Unit)", () => {
  const sampleDoc: ExtractedDocument = {
    metadata: {
      id: "firebase_doc_test_1",
      originalFilename: "mamba-ssm-paper.pdf",
      sanitizedFilename: "mamba-ssm-paper.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 204800,
      pageCount: 15,
      totalWordCount: 8200,
      totalCharCount: 48000,
      isScanned: false,
      ocrRequired: false,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
      title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
      authors: ["Albert Gu", "Tri Dao"],
      publicationYear: 2023,
      journalOrConference: "arXiv:2312.00752",
      doi: "10.48550/arXiv.2312.00752",
      arxivId: "2312.00752",
      sourceType: "arxiv",
      openAccessStatus: "green",
    },
    pages: [
      {
        pageNumber: 1,
        text: "Foundation models are now predominantly based on the Transformer architecture.",
        charCount: 76,
        wordCount: 10,
      },
    ],
    fullText: "Foundation models are now predominantly based on the Transformer architecture.",
  };

  it("successfully saves and retrieves a document via Hybrid DocumentStore", async () => {
    await documentStore.save(sampleDoc);

    const retrieved = await documentStore.get("firebase_doc_test_1");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.metadata.title).toBe("Mamba: Linear-Time Sequence Modeling with Selective State Spaces");
    expect(retrieved?.metadata.arxivId).toBe("2312.00752");
    expect(retrieved?.pages).toHaveLength(1);
  });

  it("correctly lists and searches documents in Hybrid DocumentStore", async () => {
    const list = await documentStore.list();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const searchResults = await documentStore.search("Mamba");
    expect(searchResults.some((d) => d.id === "firebase_doc_test_1")).toBe(true);

    const emptyResults = await documentStore.search("non_existent_keyword_xyz");
    expect(emptyResults.length).toBe(0);
  });

  it("handles conversation session lifecycle with document association", async () => {
    const session = await conversationStore.createSession("firebase_doc_test_1");
    expect(session.documentId).toBe("firebase_doc_test_1");
    expect(session.messages).toHaveLength(0);

    const updated = await conversationStore.addMessage(session.id, {
      id: "msg_1",
      role: "user",
      content: "What are selective state spaces?",
      timestamp: new Date().toISOString(),
    });

    expect(updated?.messages).toHaveLength(1);
    expect(updated?.messages[0].content).toBe("What are selective state spaces?");

    const docSessions = await conversationStore.getSessionsForDocument("firebase_doc_test_1");
    expect(docSessions.some((s) => s.id === session.id)).toBe(true);
  });
});
