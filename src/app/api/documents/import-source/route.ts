import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveSource } from "@/lib/import/source-resolver";
import { fetchRemotePdf, RemoteFetchError } from "@/lib/import/fetcher";
import { SSRFViolationError } from "@/lib/security/ssrf";
import { processDocument } from "@/lib/pipeline/document-processor";
import { PDFValidationError } from "@/lib/pdf";

const importSourceSchema = z.object({
  source: z.string().trim().min(1, "Please provide a valid URL, arXiv ID, or DOI."),
  customTitle: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid JSON request payload.",
          },
        },
        { status: 400 }
      );
    }

    const parseResult = importSourceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.errors[0]?.message || "Invalid input parameters.",
          },
        },
        { status: 422 }
      );
    }

    const { source, customTitle } = parseResult.data;

    // 1. Resolve source format and query metadata adapters (Crossref, OpenAlex, arXiv, Semantic Scholar)
    const resolution = await resolveSource(source);

    if (resolution.detectedType === "unsupported") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_SOURCE",
            message: resolution.accessNote || "Unsupported input format. Please enter a valid HTTPS PDF URL, arXiv paper, or DOI.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Check if open-access full-text PDF is available
    if (!resolution.fullTextAvailable || !resolution.pdfUrl) {
      return NextResponse.json(
        {
          success: true,
          data: {
            resolution,
            fullTextAvailable: false,
            message:
              resolution.accessNote ||
              "Scholarly metadata was resolved, but the full-text PDF is not publicly accessible via open access repositories. You can upload the paper PDF manually.",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
          },
        },
        { status: 200 }
      );
    }

    // 3. Securely fetch remote PDF (SSRF defense, redirects, size cap, signature checks)
    const fetchResult = await fetchRemotePdf(resolution.pdfUrl);

    // 4. Determine clean filename
    let filename = "paper.pdf";
    if (resolution.detectedType === "arxiv" && resolution.normalizedIdentifier) {
      filename = `arxiv_${resolution.normalizedIdentifier.replace(/[/\\:]+/g, "_")}.pdf`;
    } else if (resolution.metadata?.title) {
      filename = `${resolution.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}.pdf`;
    } else if (resolution.pdfUrl) {
      try {
        const u = new URL(resolution.pdfUrl);
        const base = u.pathname.split("/").pop();
        if (base && base.endsWith(".pdf")) {
          filename = base;
        }
      } catch {
        // fallback
      }
    }

    // 5. Process through unified Smart Document Processing pipeline
    const extractedDocument = await processDocument({
      buffer: fetchResult.buffer,
      originalFilename: filename,
      sourceType: resolution.detectedType,
      sourceUrl: resolution.rawInput,
      scholarlyMetadata: {
        ...resolution.metadata,
        title: customTitle || resolution.metadata?.title,
        pdfUrl: fetchResult.finalUrl,
        metadataProvider: resolution.metadata?.metadataProvider || "direct",
      },
    });

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          resolution,
          fullTextAvailable: true,
          document: extractedDocument,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof SSRFViolationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SSRF_VIOLATION",
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof RemoteFetchError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

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

    console.error("[Import Source API Error]", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during paper import.",
        },
      },
      { status: 500 }
    );
  }
}
