import { ExtractedDocument, DocumentMetadata } from "@/types/document";

export interface DocumentStore {
  save(document: ExtractedDocument): Promise<ExtractedDocument>;
  get(id: string): Promise<ExtractedDocument | null>;
  list(): Promise<DocumentMetadata[]>;
  search(query: string): Promise<DocumentMetadata[]>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

/**
 * In-Memory Document Store.
 * Provides ephemeral storage for uploaded documents and extracted pages during Phases 1–5,
 * adhering to ADR-004 before database integration in Phase 6.
 */
class InMemoryDocumentStore implements DocumentStore {
  private store = new Map<string, ExtractedDocument>();

  async save(document: ExtractedDocument): Promise<ExtractedDocument> {
    this.store.set(document.metadata.id, document);
    return document;
  }

  async get(id: string): Promise<ExtractedDocument | null> {
    return this.store.get(id) || null;
  }

  async list(): Promise<DocumentMetadata[]> {
    return Array.from(this.store.values()).map((doc) => doc.metadata);
  }

  async search(query: string): Promise<DocumentMetadata[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.list();

    return Array.from(this.store.values())
      .filter((doc) => {
        const m = doc.metadata;
        const titleMatch = m.title?.toLowerCase().includes(q) || false;
        const filenameMatch = m.originalFilename.toLowerCase().includes(q);
        const doiMatch = m.doi?.toLowerCase().includes(q) || false;
        const arxivMatch = m.arxivId?.toLowerCase().includes(q) || false;
        const authorMatch = m.authors?.some((a) => a.toLowerCase().includes(q)) || false;
        return titleMatch || filenameMatch || doiMatch || arxivMatch || authorMatch;
      })
      .map((doc) => doc.metadata);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async count(): Promise<number> {
    return this.store.size;
  }
}

// Global singleton instance for Node runtime
const globalForDocumentStore = globalThis as unknown as {
  documentStoreInstance?: DocumentStore;
};

export const documentStore =
  globalForDocumentStore.documentStoreInstance ?? new InMemoryDocumentStore();

if (process.env.NODE_ENV !== "production") {
  globalForDocumentStore.documentStoreInstance = documentStore;
}
