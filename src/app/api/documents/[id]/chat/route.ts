import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/storage/document-store";
import { conversationStore } from "@/lib/storage/conversation-store";
import { retrieveRelevantPassages } from "@/lib/retrieval/retriever";
import { getAIProvider } from "@/lib/ai";
import { AIServiceError } from "@/lib/ai/provider";
import { chatRequestSchema } from "@/lib/validation/chat.schema";
import { ChatUserMessage } from "@/types/chat";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;

  if (!id || id.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Document identifier parameter is required.",
        },
      },
      { status: 400 }
    );
  }

  // 1. Verify document presence in ephemeral memory store
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

  // 2. Reject unreadable scanned / image-only documents
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

  // 3. Validate request payload with Zod
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid or empty JSON request body.",
        },
      },
      { status: 400 }
    );
  }

  const validation = chatRequestSchema.safeParse(rawBody);
  if (!validation.success) {
    const issues = validation.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Request validation failed: ${issues}`,
        },
      },
      { status: 422 }
    );
  }

  const { message, conversationId } = validation.data;

  // 4. Session management & document-conversation boundary check
  let session = null;
  if (conversationId) {
    session = await conversationStore.getSession(conversationId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Conversation session '${conversationId}' was not found or has expired.`,
          },
        },
        { status: 404 }
      );
    }

    if (session.documentId !== id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Conversation session does not belong to the requested document.",
          },
        },
        { status: 400 }
      );
    }
  } else {
    session = await conversationStore.createSession(id);
  }

  // 5. Append user message to server-side session
  const userMsg: ChatUserMessage = {
    id: `msg_u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  };
  await conversationStore.addMessage(session.id, userMsg);

  // 6. Execute deterministic page-aware passage retrieval across ALL extracted pages
  const retrieval = retrieveRelevantPassages(document, message);

  // 7. Format conversation history for continuity (excluding the current user message)
  const historyForPrompt = session.messages
    .slice(0, -1) // Exclude the user message we just added
    .map((m) => ({
      role: m.role,
      content: m.role === "assistant" ? m.answer : m.content,
    }));

  // 8. Invoke active OpenAI Provider
  try {
    const provider = getAIProvider();
    const result = await provider.chatDocument({
      documentId: id,
      document,
      userMessage: message,
      retrievedPassages: retrieval.passages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
      })),
      conversationHistory: historyForPrompt,
    });

    const assistantMessage = result.data;

    // 9. Append assistant response to session
    await conversationStore.addMessage(session.id, assistantMessage);

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        conversationId: session.id,
        message: assistantMessage,
        retrieval: {
          pagesSearched: retrieval.pagesSearched,
          pagesUsed: retrieval.pagesUsed,
          partialCoverage: retrieval.partialCoverage,
          totalChunksSearched: retrieval.totalChunksSearched,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs,
        model: result.modelUsed,
      },
    });
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

    const message =
      error instanceof Error ? error.message : "An unexpected document chat error occurred.";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Query parameter 'conversationId' is required to clear conversation.",
        },
      },
      { status: 400 }
    );
  }

  const session = await conversationStore.getSession(conversationId);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Conversation session '${conversationId}' was not found.`,
        },
      },
      { status: 404 }
    );
  }

  if (session.documentId !== id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Conversation does not belong to the requested document.",
        },
      },
      { status: 400 }
    );
  }

  await conversationStore.clearSession(conversationId);

  return NextResponse.json({
    success: true,
    data: {
      conversationId,
      cleared: true,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}
