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

  if (document.analysisReport) {
    return NextResponse.json(
      {
        success: true,
        data: document.analysisReport,
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
    { success: false, error: { code: "NOT_ANALYZED", message: "Document has not yet been analyzed." } },
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

  // Check if document has extractable text
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
    // Empty or non-JSON body is valid (focusArea is optional)
  }

  // Token Zero-Waste Guard: return cached analysis if available and not forced
  if (!force && !focusArea && document.analysisReport) {
    return NextResponse.json(
      {
        success: true,
        data: document.analysisReport,
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

    const result = await provider.analyzeDocument({
      documentId: id,
      document,
      focusArea,
    });

    // Permanently save report in Firestore
    document.analysisReport = result.data;
    document.metadata.isAnalyzed = true;
    await documentStore.save(document);

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs,
          model: result.modelUsed,
          coveragePercentage: result.data.overview.coveragePercentage,
          analyzedPages: result.data.overview.analyzedPages,
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

    console.error(`[Document Analysis API Error - ${id}]`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while analyzing the document.",
        },
      },
      { status: 500 }
    );
  }
}
