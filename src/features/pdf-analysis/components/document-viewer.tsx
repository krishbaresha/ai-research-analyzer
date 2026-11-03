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
  Sparkles,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { ExtractedDocument } from "@/types/document";
import { DocumentAnalysisReport } from "@/types/research";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DocumentReportViewer } from "./document-report-viewer";

interface DocumentViewerProps {
  document: ExtractedDocument;
  initialReport?: DocumentAnalysisReport | null;
  onReset?: () => void;
}

export function DocumentViewer({
  document,
  initialReport = null,
  onReset,
}: DocumentViewerProps) {
  const { metadata, pages } = document;

  // View tabs
  const [activeTab, setActiveTab] = React.useState<"report" | "pages">(
    initialReport ? "report" : "pages"
  );
  const [selectedPageIndex, setSelectedPageIndex] = React.useState(0);
  const [copiedFull, setCopiedFull] = React.useState(false);
  const [copiedPage, setCopiedPage] = React.useState(false);

  // Analysis state
  const [focusArea, setFocusArea] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisStep, setAnalysisStep] = React.useState("Initiating document analysis...");
  const [analysisError, setAnalysisError] = React.useState<{ code: string; message: string } | null>(null);
  const [report, setReport] = React.useState<DocumentAnalysisReport | null>(initialReport);

  const currentPage = pages[selectedPageIndex] || pages[0];
  const pagesContainerRef = React.useRef<HTMLDivElement | null>(null);

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

  const handleSelectPage = (pageNumber: number) => {
    const idx = pages.findIndex((p) => p.pageNumber === pageNumber);
    if (idx !== -1) {
      setSelectedPageIndex(idx);
      setActiveTab("pages");
      setTimeout(() => {
        pagesContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  const handleAnalyze = async () => {
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep("Inspecting document context budget & page metadata...");

    const timer1 = setTimeout(() => {
      setAnalysisStep("Synthesizing research objectives & grounded findings...");
    }, 1500);

    const timer2 = setTimeout(() => {
      setAnalysisStep("Validating citation page numbers & report contract...");
    }, 3500);

    try {
      const res = await fetch(`/api/documents/${metadata.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusArea: focusArea.trim() || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await res.json();

      if (!res.ok || !result.success) {
        setAnalysisError({
          code: result?.error?.code || "ANALYSIS_FAILED",
          message: result?.error?.message || "Failed to analyze document.",
        });
        setIsAnalyzing(false);
        return;
      }

      setReport(result.data as DocumentAnalysisReport);
      setActiveTab("report");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during analysis.";
      setAnalysisError({
        code: "NETWORK_ERROR",
        message: msg,
      });
    } finally {
      setIsAnalyzing(false);
    }
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
                PDF Document Intelligence
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
            <span>File Size: <strong>{formatFileSize(metadata.fileSizeBytes)}</strong></span>
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
              <span className="text-muted-foreground block text-[11px]">AI Status</span>
              <span className="text-base font-semibold text-foreground flex items-center gap-1.5">
                {report ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Report Ready
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium text-xs">Unanalyzed</span>
                )}
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
            Optical Character Recognition (OCR) is required to extract text from such files, which is not included in the MVP.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Initiation Card (If not yet analyzed or to re-analyze) */}
      {!metadata.isScanned && (
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {report ? "Re-Analyze Document" : "Evidence-Grounded Document Analysis"}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                OpenAI Responses API
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Synthesize an academic report with page citations, methodology assessment, key findings, and research gaps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Focus Area / Analytical Constraints (Optional)"
              placeholder="e.g. Focus on benchmark comparisons, computational complexity, and empirical dataset evaluation"
              value={focusArea}
              disabled={isAnalyzing}
              onChange={(e) => setFocusArea(e.target.value)}
              helperText="Guide the synthesis to highlight specific research aspects."
            />

            {analysisError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold">Analysis Failed</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {analysisError.message}
                </AlertDescription>
              </Alert>
            )}

            {isAnalyzing && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span>{analysisStep}</span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleAnalyze}
                isLoading={isAnalyzing}
                disabled={isAnalyzing}
                className="gap-2 text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>{report ? "Re-Run Analysis" : "Generate Grounded Report"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Switcher Tabs */}
      <div className="flex border-b border-border">
        {report && (
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
              activeTab === "report"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Structured Research Report</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeTab === "pages"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Extracted Document Pages ({pages.length})</span>
        </button>
      </div>

      {/* Tab 1: Render Document Analysis Report */}
      {activeTab === "report" && report && (
        <DocumentReportViewer
          report={report}
          onSelectPage={handleSelectPage}
        />
      )}

      {/* Tab 2: Render Page Navigation & Extracted Content Viewer */}
      {activeTab === "pages" && (
        <div ref={pagesContainerRef}>
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
        </div>
      )}

      {/* Phase 4 Integration Guarantee */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-foreground block">
            Grounded Citations Guarantee
          </span>
          <span className="text-[11px]">
            Every document finding in this analysis is mapped directly to its origin page with exact text grounding.
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
