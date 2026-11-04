import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/storage/document-store";
import { getAIProvider, AIServiceError } from "@/lib/ai";
import { analyzeDocumentRequestSchema } from "@/lib/validation/research.schema";

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
  try {
    const body = await req.json();
    const validation = analyzeDocumentRequestSchema.safeParse(body);
    if (validation.success && validation.data.focusArea) {
      focusArea = validation.data.focusArea;
    }
  } catch {
    // Optional
  }

  try {
    const provider = getAIProvider();

    const result = await provider.exploreDocument({
      documentId: id,
      document,
      focusArea,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs,
          model: result.modelUsed,
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
