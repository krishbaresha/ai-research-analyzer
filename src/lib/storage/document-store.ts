import { ExtractedDocument, DocumentMetadata } from "@/types/document";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase/config";
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

export interface DocumentStore {
  save(document: ExtractedDocument): Promise<ExtractedDocument>;
  get(id: string): Promise<ExtractedDocument | null>;
  list(): Promise<DocumentMetadata[]>;
  search(query: string): Promise<DocumentMetadata[]>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Hybrid Document Store with Cloud Firestore persistence.
 * Automatically saves papers into Firebase Firestore when configured,
 * while maintaining a high-performance in-memory cache and falling back
 * seamlessly during unit testing or offline operation.
 */
class HybridDocumentStore implements DocumentStore {
  private cache = new Map<string, ExtractedDocument>();

  async save(document: ExtractedDocument): Promise<ExtractedDocument> {
    this.cache.set(document.metadata.id, document);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "documents", document.metadata.id);
          await setDoc(docRef, cleanForFirestore({
            ...document,
            updatedAt: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[Firestore DocumentStore] Failed to persist to Firebase:", err);
      }
    }

    return document;
  }

  async get(id: string): Promise<ExtractedDocument | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "documents", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as ExtractedDocument;
            this.cache.set(id, data);
            return data;
          }
        }
      } catch (err) {
        console.warn("[Firestore DocumentStore] Failed to fetch from Firebase:", err);
      }
    }

    return null;
  }

  async list(): Promise<DocumentMetadata[]> {
    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const colRef = collection(db, "documents");
          const snap = await getDocs(colRef);
          const list: DocumentMetadata[] = [];
          snap.forEach((d) => {
            const docData = d.data() as ExtractedDocument;
            if (docData && docData.metadata) {
              list.push(docData.metadata);
              if (!this.cache.has(docData.metadata.id)) {
                this.cache.set(docData.metadata.id, docData);
              }
            }
          });
          if (list.length > 0) return list;
        }
      } catch (err) {
        console.warn("[Firestore DocumentStore] Failed to list from Firebase:", err);
      }
    }

    return Array.from(this.cache.values()).map((doc) => doc.metadata);
  }

  async search(query: string): Promise<DocumentMetadata[]> {
    const q = query.toLowerCase().trim();
    const all = await this.list();
    if (!q) return all;

    return all.filter((m) => {
      const titleMatch = m.title?.toLowerCase().includes(q) || false;
      const filenameMatch = m.originalFilename.toLowerCase().includes(q);
      const doiMatch = m.doi?.toLowerCase().includes(q) || false;
      const arxivMatch = m.arxivId?.toLowerCase().includes(q) || false;
      const authorMatch = m.authors?.some((a) => a.toLowerCase().includes(q)) || false;
      return titleMatch || filenameMatch || doiMatch || arxivMatch || authorMatch;
    });
  }

  async delete(id: string): Promise<boolean> {
    const wasInCache = this.cache.delete(id);

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const docRef = doc(db, "documents", id);
          await deleteDoc(docRef);
          return true;
        }
      } catch (err) {
        console.warn("[Firestore DocumentStore] Failed to delete from Firebase:", err);
      }
    }

    return wasInCache;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async count(): Promise<number> {
    const all = await this.list();
    return all.length;
  }
}

// Global singleton instance for Node runtime
const globalForDocumentStore = globalThis as unknown as {
  documentStoreInstance?: DocumentStore;
};

export const documentStore =
  globalForDocumentStore.documentStoreInstance ?? new HybridDocumentStore();

if (process.env.NODE_ENV !== "production") {
  globalForDocumentStore.documentStoreInstance = documentStore;
}
