import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/documents/import-source/route";
import * as fetcher from "@/lib/import/fetcher";
import * as resolver from "@/lib/import/source-resolver";
import { documentStore } from "@/lib/storage/document-store";
import { createValidSinglePagePdfBuffer } from "../fixtures/pdf-fixtures";

describe("Paper Import API Integration (Phase 5 Part B)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await documentStore.clear();
  });

  it("rejects missing or empty source parameter with 422", async () => {
    const req = new NextRequest("http://localhost:3000/api/documents/import-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("blocks SSRF target with 400 SSRF_VIOLATION", async () => {
    const req = new NextRequest("http://localhost:3000/api/documents/import-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "https://127.0.0.1/secret.pdf" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("SSRF_VIOLATION");
  });

  it("returns 200 with fullTextAvailable: false when DOI is paywalled", async () => {
    vi.spyOn(resolver, "resolveSource").mockResolvedValueOnce({
      detectedType: "doi",
      normalizedIdentifier: "10.1000/paywalled.doi",
      rawInput: "10.1000/paywalled.doi",
      fullTextAvailable: false,
      isOpenAccess: false,
      landingPageUrl: "https://doi.org/10.1000/paywalled.doi",
      accessNote: "Full text is not publicly accessible.",
      metadata: {
        title: "Paywalled Science Paper",
        authors: ["Jane Doe"],
        publicationYear: 2022,
        metadataProvider: "crossref",
      },
    });

    const req = new NextRequest("http://localhost:3000/api/documents/import-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "10.1000/paywalled.doi" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.fullTextAvailable).toBe(false);
    expect(data.data.resolution.metadata.title).toBe("Paywalled Science Paper");
  });

  it("successfully imports open-access paper and stores in Research Library", async () => {
    vi.spyOn(resolver, "resolveSource").mockResolvedValueOnce({
      detectedType: "arxiv",
      normalizedIdentifier: "1706.03762",
      rawInput: "1706.03762",
      fullTextAvailable: true,
      isOpenAccess: true,
      pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
      landingPageUrl: "https://arxiv.org/abs/1706.03762",
      metadata: {
        title: "Attention Is All You Need",
        authors: ["Ashish Vaswani", "Noam Shazeer"],
        publicationYear: 2017,
        journalOrConference: "NeurIPS",
        arxivId: "1706.03762",
        metadataProvider: "arxiv",
        openAccessStatus: "green",
      },
    });

    const sampleBuffer = createValidSinglePagePdfBuffer();

    vi.spyOn(fetcher, "fetchRemotePdf").mockResolvedValueOnce({
      buffer: sampleBuffer,
      finalUrl: "https://arxiv.org/pdf/1706.03762.pdf",
      contentType: "application/pdf",
      fileSizeBytes: sampleBuffer.length,
    });

    const req = new NextRequest("http://localhost:3000/api/documents/import-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "1706.03762" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.fullTextAvailable).toBe(true);
    expect(data.data.document.metadata.title).toBe("Attention Is All You Need");
    expect(data.data.document.metadata.sourceType).toBe("arxiv");
    expect(data.data.document.metadata.arxivId).toBe("1706.03762");

    // Verify stored in document store
    const stored = await documentStore.get(data.data.document.metadata.id);
    expect(stored).toBeDefined();
    expect(stored?.metadata.title).toBe("Attention Is All You Need");
  });
});
