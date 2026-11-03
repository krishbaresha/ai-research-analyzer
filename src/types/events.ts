export type DomainEventType =
  | "document.uploaded"
  | "document.imported"
  | "document.extracted"
  | "document.classified"
  | "document.analysis.completed"
  | "document.analysis.failed"
  | "document.chat.created";

export interface BaseDomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  timestamp: string;
  payload: T;
}

export interface DocumentUploadedEvent extends BaseDomainEvent<{ documentId: string; filename: string; sizeBytes: number }> {
  type: "document.uploaded";
}

export interface DocumentImportedEvent extends BaseDomainEvent<{ documentId: string; sourceType: string; sourceUrl?: string; doi?: string; arxivId?: string }> {
  type: "document.imported";
}

export interface DocumentExtractedEvent extends BaseDomainEvent<{ documentId: string; pageCount: number; wordCount: number; isScanned: boolean }> {
  type: "document.extracted";
}

export interface DocumentClassifiedEvent extends BaseDomainEvent<{ documentId: string; classification: string; confidence?: number }> {
  type: "document.classified";
}

export interface DocumentAnalysisCompletedEvent extends BaseDomainEvent<{ documentId: string; reportTitle: string; totalPages: number }> {
  type: "document.analysis.completed";
}

export interface DocumentAnalysisFailedEvent extends BaseDomainEvent<{ documentId: string; error: string }> {
  type: "document.analysis.failed";
}

export interface DocumentChatCreatedEvent extends BaseDomainEvent<{ conversationId: string; documentId: string; initialQuery: string }> {
  type: "document.chat.created";
}

export type DomainEvent =
  | DocumentUploadedEvent
  | DocumentImportedEvent
  | DocumentExtractedEvent
  | DocumentClassifiedEvent
  | DocumentAnalysisCompletedEvent
  | DocumentAnalysisFailedEvent
  | DocumentChatCreatedEvent;
