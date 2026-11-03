import { NextRequest, NextResponse } from "next/server";
import { PDFValidationError } from "@/lib/pdf";
import { processDocument } from "@/lib/pipeline/document-processor";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Request must be multipart/form-data with a 'file' field.",
          },
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "No valid file uploaded. Please include a 'file' in the form data.",
          },
        },
        { status: 400 }
      );
    }

    const originalFilename = file instanceof File ? file.name : "document.pdf";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process document through smart pipeline
    const extractedDocument = await processDocument({
      buffer,
      originalFilename,
      sourceType: "upload",
    });

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: extractedDocument,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof PDFValidationError) {
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

    console.error("[PDF Upload API Error]", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing the PDF file.",
        },
      },
      { status: 500 }
    );
  }
}
