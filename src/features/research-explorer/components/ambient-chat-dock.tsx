"use client";

import * as React from "react";
import { MessageSquare, X, Maximize2, Minimize2, Sparkles, ChevronRight } from "lucide-react";
import { ExtractedDocument } from "@/types/document";
import { DocumentChat } from "@/features/document-chat/components/document-chat";
import { Button } from "@/components/ui/button";
import { BrandSymbol } from "@/components/brand/logo";

interface AmbientChatDockProps {
  document: ExtractedDocument;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageNumber: number) => void;
  initialQuery?: string;
}

export function AmbientChatDock({
  document,
  isOpen,
  onClose,
  onSelectPage,
  initialQuery,
}: AmbientChatDockProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Dock Header */}
      <div className="h-14 border-b border-border px-4 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-2">
          <BrandSymbol size={18} className="text-primary" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Ambient Research Assistant
            </h4>
            <p className="text-[10px] text-muted-foreground truncate max-w-[240px]">
              Grounded in {document.metadata.title || document.metadata.originalFilename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Close Assistant Dock"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Embedded Document Chat Component */}
      <div className="flex-1 overflow-hidden p-2">
        <DocumentChat
          document={document}
          onSelectPage={onSelectPage}
        />
      </div>
    </div>
  );
}
