import { NextRequest, NextResponse } from "next/server";
import { analyzeTopicRequestSchema } from "@/lib/validation/research.schema";
import { getAIProvider, AIServiceError } from "@/lib/ai";

export async function POST(req: NextRequest) {
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
            message: "Invalid JSON in request payload.",
          },
        },
        { status: 400 }
      );
    }

    const validation = analyzeTopicRequestSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.issues.map((i) => ({
        field: i.path.join("."),
        issue: i.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid research topic parameters.",
            details,
          },
        },
        { status: 422 }
      );
    }

    const { topic, scope } = validation.data;
    const provider = getAIProvider();

    const result = await provider.analyzeTopic({
      topic,
      scope,
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

    console.error("[Topic Analysis API Error]", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while analyzing the research topic.",
        },
      },
      { status: 500 }
    );
  }
}
