import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as listDocuments } from "@/app/api/documents/route";
import { DELETE as deleteDocument, GET as getDocument } from "@/app/api/documents/[id]/route";
import { documentStore } from "@/lib/storage/document-store";
import { ExtractedDocument } from "@/types/document";

describe("Research Library API Integration (Phase 5 Part D)", () => {
  beforeEach(async () => {
    await documentStore.clear();
  });

  const sampleDoc1: ExtractedDocument = {
    metadata: {
      id: "doc_test_1",
      originalFilename: "attention.pdf",
      sanitizedFilename: "attention.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 120000,
      pageCount: 11,
      totalWordCount: 5400,
      totalCharCount: 36000,
      isScanned: false,
      ocrRequired: false,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer"],
      publicationYear: 2017,
      sourceType: "arxiv",
      arxivId: "1706.03762",
    },
    pages: [{ pageNumber: 1, text: "Attention mechanism", charCount: 20, wordCount: 2 }],
    fullText: "Attention mechanism",
  };

  const sampleDoc2: ExtractedDocument = {
    metadata: {
      id: "doc_test_2",
      originalFilename: "mamba.pdf",
      sanitizedFilename: "mamba.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 95000,
      pageCount: 14,
      totalWordCount: 7200,
      totalCharCount: 48000,
      isScanned: false,
      ocrRequired: false,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
      title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
      authors: ["Albert Gu", "Tri Dao"],
      publicationYear: 2023,
      sourceType: "upload",
    },
    pages: [{ pageNumber: 1, text: "Selective state spaces", charCount: 22, wordCount: 3 }],
    fullText: "Selective state spaces",
  };

  it("lists all papers in library", async () => {
    await documentStore.save(sampleDoc1);
    await documentStore.save(sampleDoc2);

    const req = new NextRequest("http://localhost:3000/api/documents");
    const res = await listDocuments(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.documents.length).toBe(2);
  });

  it("filters papers by search query (?q=mamba)", async () => {
    await documentStore.save(sampleDoc1);
    await documentStore.save(sampleDoc2);

    const req = new NextRequest("http://localhost:3000/api/documents?q=mamba");
    const res = await listDocuments(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.documents.length).toBe(1);
    expect(data.data.documents[0].id).toBe("doc_test_2");
  });

  it("deletes a paper by ID with DELETE /api/documents/[id]", async () => {
    await documentStore.save(sampleDoc1);

    const req = new NextRequest("http://localhost:3000/api/documents/doc_test_1", {
      method: "DELETE",
    });
    const res = await deleteDocument(req, {
      params: Promise.resolve({ id: "doc_test_1" }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(true);

    // Verify deleted
    const getReq = new NextRequest("http://localhost:3000/api/documents/doc_test_1");
    const getRes = await getDocument(getReq, {
      params: Promise.resolve({ id: "doc_test_1" }),
    });
    expect(getRes.status).toBe(404);
  });
});
