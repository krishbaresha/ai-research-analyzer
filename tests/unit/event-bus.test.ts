import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus } from "@/lib/events/event-bus";
import { DocumentUploadedEvent, DocumentImportedEvent } from "@/types/events";

describe("Domain Event Bus (Unit - Phase 5 / Phase 10 Foundation)", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("subscribes and receives emitted domain events", async () => {
    const handler = vi.fn();
    bus.on("document.uploaded", handler);

    const event: DocumentUploadedEvent = {
      id: "evt_1",
      type: "document.uploaded",
      timestamp: new Date().toISOString(),
      payload: {
        documentId: "doc_123",
        filename: "attention.pdf",
        sizeBytes: 1024,
      },
    };

    await bus.emit(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("allows unsubscription from domain events", async () => {
    const handler = vi.fn();
    const unsubscribe = bus.on("document.imported", handler);

    const event: DocumentImportedEvent = {
      id: "evt_2",
      type: "document.imported",
      timestamp: new Date().toISOString(),
      payload: {
        documentId: "doc_456",
        sourceType: "arxiv",
        arxivId: "2301.12345",
      },
    };

    await bus.emit(event);
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    await bus.emit(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("maintains an in-memory sliding history window", async () => {
    for (let i = 0; i < 5; i++) {
      await bus.emit({
        id: `evt_${i}`,
        type: "document.classified",
        timestamp: new Date().toISOString(),
        payload: {
          documentId: `doc_${i}`,
          classification: "preprint",
        },
      });
    }

    const history = bus.getHistory();
    expect(history.length).toBe(5);
    expect(history[0].id).toBe("evt_0");
    expect(history[4].id).toBe("evt_4");
  });
});
