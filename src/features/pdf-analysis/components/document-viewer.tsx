"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ExtractedDocument } from "@/types/document";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  document: ExtractedDocument;
  onReset?: () => void;
}

export function DocumentViewer({ document, onReset }: DocumentViewerProps) {
  const [selectedPageIndex, setSelectedPageIndex] = React.useState(0);
  const [copiedFull, setCopiedFull] = React.useState(false);
  const [copiedPage, setCopiedPage] = React.useState(false);

  const { metadata, pages } = document;
  const currentPage = pages[selectedPageIndex] || pages[0];

  const handleCopyFullText = () => {
    navigator.clipboard.writeText(document.fullText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopyPageText = () => {
    if (!currentPage) return;
    navigator.clipboard.writeText(currentPage.text);
    setCopiedPage(true);
    setTimeout(() => setCopiedPage(false), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Document Overview Header */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                PDF Extracted Document
              </Badge>
              {metadata.isScanned ? (
                <Badge variant="destructive" className="text-[10px]">
                  Scanned / OCR Required
                </Badge>
              ) : (
                <Badge variant="from_document" className="text-[10px]">
                  Text Extracted Cleanly
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFullText}
                className="gap-1.5 text-xs h-8"
              >
                {copiedFull ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied All</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Full Text</span>
                  </>
                )}
              </Button>
              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Upload Another</span>
                </Button>
              )}
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-2">
            {metadata.sanitizedFilename}
          </CardTitle>
          <CardDescription className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span>Original: <strong>{metadata.originalFilename}</strong></span>
            <span>ID: <code className="font-mono text-[11px]">{metadata.id}</code></span>
          </CardDescription>
        </CardHeader>

        {/* Stats Grid */}
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
              <span className="text-muted-foreground block text-[11px]">Total Pages</span>
              <span className="text-base font-semibold text-foreground font-mono">
                {metadata.pageCount}
              </span>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
              <span className="text-muted-foreground block text-[11px]">Word Count</span>
              <span className="text-base font-semibold text-foreground font-mono">
                {metadata.totalWordCount.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
              <span className="text-muted-foreground block text-[11px]">Character Count</span>
              <span className="text-base font-semibold text-foreground font-mono">
                {metadata.totalCharCount.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1 bg-card">
              <span className="text-muted-foreground block text-[11px]">File Size</span>
              <span className="text-base font-semibold text-foreground font-mono">
                {formatFileSize(metadata.fileSizeBytes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanned PDF Warning Banner if detected */}
      {metadata.isScanned && (
        <Alert variant="warning" className="border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-200 text-xs font-bold">
            Scanned or Image-Only Document Detected
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mt-1">
            This document contains negligible extractable digital text (fewer than 50 characters).
            It appears to consist of scanned pages, photographed text, or rasterized images.
            <strong> Optical Character Recognition (OCR) is required</strong> to extract text from such files,
            which is not included in the MVP.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Navigation & Extracted Content Viewer */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Page {currentPage ? currentPage.pageNumber : 1} of {metadata.pageCount}
              </CardTitle>
              {currentPage && (
                <span className="text-[11px] text-muted-foreground">
                  ({currentPage.wordCount} words, {currentPage.charCount} chars)
                </span>
              )}
            </div>

            {/* Page navigation controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPageIndex <= 0}
                onClick={() => setSelectedPageIndex((prev) => Math.max(0, prev - 1))}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-[320px] py-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => setSelectedPageIndex(idx)}
                    className={cn(
                      "h-7 min-w-7 px-1.5 rounded text-[11px] font-mono transition-colors",
                      selectedPageIndex === idx
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {p.pageNumber}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPageIndex >= pages.length - 1}
                onClick={() => setSelectedPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                className="h-8 px-2 text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="sr-only">Next Page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPageText}
                className="h-8 gap-1 text-xs"
              >
                {copiedPage ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copy Page</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {currentPage && currentPage.text ? (
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 font-sans text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text max-h-[600px] overflow-y-auto">
              {currentPage.text}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No Digital Text on Page {currentPage?.pageNumber || 1}</p>
              <p className="text-[11px] max-w-sm mx-auto">
                This page has no extractable digital text layer. If this is a diagram or scanned page, OCR would be required.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 3 Boundary Assurance Notice */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-foreground block">
            Phase 3 Extraction Complete
          </span>
          <span className="text-[11px]">
            Text and page boundaries have been reliably parsed and cached in the server memory store.
            Per Phase 3 specifications, no LLM calls were made.
          </span>
        </div>
        <Link href={`/documents/${metadata.id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
            <span>Workspace View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
