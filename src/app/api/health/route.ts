import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/validation/env.schema";

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    success: true,
    data: {
      status: "healthy",
      phase: 5,
      provider: "openai",
      openAIConfigured: config.hasOpenAIKey,
      configuredModel: config.model,
      maxUploadBytes: config.maxUploadSizeBytes,
      runtime: "nodejs",
      capabilities: {
        documentChat: true,
        passageRetrieval: "bm25",
        paperImportSources: ["upload", "direct_url", "arxiv", "doi"],
        metadataProviders: ["crossref", "openalex", "arxiv", "semanticscholar"],
        ssrfProtection: true,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
