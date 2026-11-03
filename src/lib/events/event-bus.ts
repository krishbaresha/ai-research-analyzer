import { DomainEvent, DomainEventType } from "@/types/events";

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;
type GenericEventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Lightweight, synchronous in-memory Event Bus.
 * Dispatches domain events across application modules and preserves a sliding history
 * window to support inspection, testing, and future background automation pipelines (Phase 10).
 */
export class EventBus {
  private handlers = new Map<DomainEventType, Set<GenericEventHandler>>();
  private history: DomainEvent[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Subscribe an event listener.
   * Returns an unsubscribe function.
   */
  on<T extends DomainEvent>(eventType: T["type"], handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const set = this.handlers.get(eventType)!;
    const genericHandler: GenericEventHandler = (event) => handler(event as T);
    set.add(genericHandler);

    return () => {
      set.delete(genericHandler);
    };
  }

  /**
   * Emit a domain event.
   * Executes registered listeners and appends to in-memory sliding history.
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    const listeners = this.handlers.get(event.type);
    if (listeners && listeners.size > 0) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, err);
        }
      }
    }
  }

  /**
   * Get sliding history of emitted events.
   */
  getHistory(): readonly DomainEvent[] {
    return [...this.history];
  }

  /**
   * Clear history and registered listeners (useful for testing).
   */
  clear(): void {
    this.handlers.clear();
    this.history = [];
  }
}

// Global singleton instance for Node runtime
const globalForEventBus = globalThis as unknown as {
  eventBusInstance?: EventBus;
};

export const eventBus = globalForEventBus.eventBusInstance ?? new EventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.eventBusInstance = eventBus;
}
