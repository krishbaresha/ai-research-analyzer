import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/validation/env.schema";

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    success: true,
    data: {
      status: "healthy",
      phase: 1,
      groqConfigured: config.hasGroqKey,
      configuredModel: config.model,
      fallbackModel: config.fallbackModel,
      maxUploadBytes: config.maxUploadSizeBytes,
      runtime: "nodejs",
      timestamp: new Date().toISOString(),
    },
  });
}
