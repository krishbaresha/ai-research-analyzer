import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/storage/document-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {
    const documents = query.trim()
      ? await documentStore.search(query.trim())
      : await documentStore.list();

    return NextResponse.json(
      {
        success: true,
        data: {
          documents,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          count: documents.length,
          query: query.trim() || undefined,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Documents List API Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve documents from store.",
        },
      },
      { status: 500 }
    );
  }
}
