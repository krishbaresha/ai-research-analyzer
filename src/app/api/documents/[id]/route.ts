import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/storage/document-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Document ID is required.",
        },
      },
      { status: 400 }
    );
  }

  const document = await documentStore.get(id);

  if (!document) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Document with ID '${id}' was not found.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: document,
    },
    { status: 200 }
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Document ID is required.",
        },
      },
      { status: 400 }
    );
  }

  const deleted = await documentStore.delete(id);

  if (!deleted) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Document with ID '${id}' was not found.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id,
        deleted: true,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}
