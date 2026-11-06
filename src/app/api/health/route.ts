import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/validation/env.schema";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export async function GET() {
  const config = getServerConfig();
  const firebaseReady = isFirebaseConfigured();

  return NextResponse.json({
    success: true,
    data: {
      status: "healthy",
      phase: 6,
      provider: "openai",
      openAIConfigured: config.hasOpenAIKey,
      configuredModel: config.model,
      database: firebaseReady ? "firebase_firestore" : "in_memory",
      firebaseConfigured: firebaseReady,
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
