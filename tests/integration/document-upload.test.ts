import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/documents/upload/route";
import { GET } from "@/app/api/documents/[id]/route";
import { documentStore } from "@/lib/storage/document-store";
import { NextRequest } from "next/server";
import {
  createValidSinglePagePdfBuffer,
  createScannedNoTextPdfBuffer,
  createNonPdfBuffer,
} from "../fixtures/pdf-fixtures";

describe("Document Upload & Retrieval Integration", () => {
  beforeEach(async () => {
    await documentStore.clear();
  });

  it("handles complete upload lifecycle: parses PDF, stores in memory, and returns metadata", async () => {
    const pdfBuffer = createValidSinglePagePdfBuffer();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("file", blob, "attention-paper.pdf");

    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.metadata.id).toBeDefined();
    expect(body.data.metadata.sanitizedFilename).toBe("attention-paper.pdf");
    expect(body.data.metadata.pageCount).toBe(1);
    expect(body.data.pages[0].text).toContain("Transformers are neural network architectures");

    // Verify document can now be retrieved via GET /api/documents/[id]
    const getReq = new NextRequest(`http://localhost:3000/api/documents/${body.data.metadata.id}`);
    const getRes = await GET(getReq, {
      params: Promise.resolve({ id: body.data.metadata.id }),
    });
    const getBody = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getBody.success).toBe(true);
    expect(getBody.data.metadata.id).toBe(body.data.metadata.id);
  });

  it("identifies scanned PDF during upload and flags OCR requirement", async () => {
    const pdfBuffer = createScannedNoTextPdfBuffer();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("file", blob, "scanned-report.pdf");

    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.metadata.isScanned).toBe(true);
    expect(body.data.metadata.ocrRequired).toBe(true);
  });

  it("rejects non-PDF uploads with 415 INVALID_FILE_SIGNATURE", async () => {
    const fakeBuffer = createNonPdfBuffer();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fakeBuffer)], { type: "application/pdf" });
    formData.append("file", blob, "fake.pdf");

    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(415);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_FILE_SIGNATURE");
  });

  it("returns 400 when no file is included in request", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 for non-existent document ID", async () => {
    const getReq = new NextRequest("http://localhost:3000/api/documents/non_existent_doc");
    const getRes = await GET(getReq, {
      params: Promise.resolve({ id: "non_existent_doc" }),
    });
    const getBody = await getRes.json();

    expect(getRes.status).toBe(404);
    expect(getBody.success).toBe(false);
    expect(getBody.error.code).toBe("NOT_FOUND");
  });
});
