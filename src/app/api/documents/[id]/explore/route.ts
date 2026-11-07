import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/storage/document-store";
import { getAIProvider, AIServiceError } from "@/lib/ai";
import { analyzeDocumentRequestSchema } from "@/lib/validation/research.schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Document ID parameter is required." } },
      { status: 400 }
    );
  }

  const document = await documentStore.get(id);
  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: `Document with ID '${id}' was not found.` } },
      { status: 404 }
    );
  }

  if (document.explorerData) {
    return NextResponse.json(
      {
        success: true,
        data: document.explorerData,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
          tokensSaved: true,
          source: "firestore_permanent_cache",
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: "NOT_EXPLORED", message: "Document has not yet been explored." } },
    { status: 404 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Document ID parameter is required.",
        },
      },
      { status: 400 }
    );
  }

  // Retrieve extracted document from memory store
  const document = await documentStore.get(id);

  if (!document) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Document with ID '${id}' was not found. Please upload the PDF document first.`,
        },
      },
      { status: 404 }
    );
  }

  // Check if document has extractable digital text
  if (
    document.pages.length === 0 ||
    document.metadata.totalCharCount === 0 ||
    (document.metadata.isScanned && document.metadata.totalCharCount < 50)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "OCR_REQUIRED",
          message:
            "This document contains no digital text layer. Scanned or image-only documents require Optical Character Recognition (OCR), which is not supported in the MVP.",
        },
      },
      { status: 422 }
    );
  }

  // Parse optional request parameters
  let focusArea: string | undefined;
  let force = false;
  try {
    const body = await req.json();
    if (body.force === true) force = true;
    const validation = analyzeDocumentRequestSchema.safeParse(body);
    if (validation.success && validation.data.focusArea) {
      focusArea = validation.data.focusArea;
    }
  } catch {
    // Optional
  }

  // 1. Token Zero-Waste Guard: If paper was already analyzed and user did not request a custom focus or force refresh, return cached data!
  if (!force && !focusArea && document.explorerData) {
    return NextResponse.json(
      {
        success: true,
        data: document.explorerData,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
          tokensSaved: true,
          model: "firestore-permanent-cache",
        },
      },
      { status: 200 }
    );
  }

  try {
    const provider = getAIProvider();

    const result = await provider.exploreDocument({
      documentId: id,
      document,
      focusArea,
    });

    // 2. Permanently save explored data into Firebase Firestore document record
    document.explorerData = result.data;
    document.metadata.isExplored = true;
    if (result.data.identity.title && result.data.identity.title !== "Academic Research Paper") {
      document.metadata.title = result.data.identity.title;
    }
    if (result.data.identity.authors && result.data.identity.authors.length > 0) {
      document.metadata.authors = result.data.identity.authors;
    }
    if (result.data.identity.publicationYear) {
      document.metadata.publicationYear = Number(result.data.identity.publicationYear) || document.metadata.publicationYear;
    }
    await documentStore.save(document);

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs,
          model: result.modelUsed,
          cached: false,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AIServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "An unexpected inference error occurred.";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
