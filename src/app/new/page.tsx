"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileUp,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  FileText,
  AlertCircle,
  Key,
  CheckCircle,
  X,
  Globe,
  BookOpen,
  ExternalLink,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ResearchReport } from "@/types/research";
import { ExtractedDocument } from "@/types/document";
import { SourceResolutionResult } from "@/types/import";
import { ReportViewer } from "@/features/research/components/report-viewer";
import { DocumentViewer } from "@/features/pdf-analysis/components/document-viewer";

type Mode = "topic" | "document";
type DocSubMode = "upload" | "import";

interface ApiErrorPayload {
  code: string;
  message: string;
}

export default function NewResearchPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "document" ? "document" : "topic";
  const [activeMode, setActiveMode] = React.useState<Mode>(initialMode);
  const [docSubMode, setDocSubMode] = React.useState<DocSubMode>("upload");

  // Form input state (Topic Analysis)
  const [topic, setTopic] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Async submission state (Topic Analysis)
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState("Initiating inquiry...");
  const [apiError, setApiError] = React.useState<ApiErrorPayload | null>(null);
  const [report, setReport] = React.useState<ResearchReport | null>(null);

  // PDF Document Upload & Extraction State
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStep, setUploadStep] = React.useState("Validating document headers...");
  const [uploadError, setUploadError] = React.useState<ApiErrorPayload | null>(null);
  const [extractedDoc, setExtractedDoc] = React.useState<ExtractedDocument | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Remote Scholarly Import State (Phase 5 Part B)
  const [importInput, setImportInput] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [importStep, setImportStep] = React.useState("Resolving scholarly source...");
  const [importError, setImportError] = React.useState<ApiErrorPayload | null>(null);
  const [paywalledResolution, setPaywalledResolution] = React.useState<SourceResolutionResult | null>(null);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setValidationError("Please enter a research question or topic.");
      return;
    }
    if (topic.trim().length < 5) {
      setValidationError("Research question must be at least 5 characters long.");
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    setLoadingStep("Connecting to OpenAI Responses API...");

    try {
      const timer1 = setTimeout(() => {
        setLoadingStep("Structuring academic analysis & evidence bounds...");
      }, 1200);

      const timer2 = setTimeout(() => {
        setLoadingStep("Validating structured report contract...");
      }, 3000);

      const res = await fetch("/api/research/analyze-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          scope: scope.trim() || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError({
          code: data?.error?.code || "INFERENCE_ERROR",
          message: data?.error?.message || "Failed to generate research analysis.",
        });
        setIsLoading(false);
        return;
      }

      setReport(data.data as ResearchReport);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      setApiError({
        code: "NETWORK_ERROR",
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError({
        code: "INVALID_EXTENSION",
        message: "Only PDF documents (.pdf) are supported.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError({
        code: "PAYLOAD_TOO_LARGE",
        message: "File exceeds the 10 MB maximum upload limit.",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError({
        code: "NO_FILE",
        message: "Please choose or drag a PDF file to upload.",
      });
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadStep("Validating file signature & headers...");

    const timer1 = setTimeout(() => {
      setUploadStep("Parsing page boundaries & text streams...");
    }, 800);

    const timer2 = setTimeout(() => {
      setUploadStep("Indexing extracted passages into memory store...");
    }, 1800);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await res.json();

      if (!res.ok || !result.success) {
        setUploadError({
          code: result?.error?.code || "UPLOAD_FAILED",
          message: result?.error?.message || "Failed to process and extract PDF text.",
        });
        setIsUploading(false);
        return;
      }

      setExtractedDoc(result.data as ExtractedDocument);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during upload.";
      setUploadError({
        code: "NETWORK_ERROR",
        message: msg,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remote Scholarly Import Handler (Phase 5 Part B)
  const handleRemoteImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = importInput.trim();
    if (!trimmedInput) {
      setImportError({
        code: "EMPTY_INPUT",
        message: "Please enter a valid PDF URL, arXiv ID/URL, or DOI.",
      });
      return;
    }

    setImportError(null);
    setPaywalledResolution(null);
    setIsImporting(true);
    setImportStep("Resolving source metadata (Crossref / OpenAlex / arXiv)...");

    const timer1 = setTimeout(() => {
      setImportStep("Performing SSRF safety check on remote host...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setImportStep("Downloading open-access PDF bytes & checking magic bytes...");
    }, 2500);

    const timer3 = setTimeout(() => {
      setImportStep("Extracting digital page boundaries & registering in Library...");
    }, 4500);

    try {
      const res = await fetch("/api/documents/import-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: trimmedInput }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const result = await res.json();

      if (!res.ok || !result.success) {
        setImportError({
          code: result?.error?.code || "IMPORT_FAILED",
          message: result?.error?.message || "Failed to import research paper.",
        });
        setIsImporting(false);
        return;
      }

      // If full text is paywalled / unavailable
      if (!result.data.fullTextAvailable) {
        setPaywalledResolution(result.data.resolution as SourceResolutionResult);
        setIsImporting(false);
        return;
      }

      // Successful full-text extraction
      setExtractedDoc(result.data.document as ExtractedDocument);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during paper import.";
      setImportError({
        code: "NETWORK_ERROR",
        message: msg,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetTopic = () => {
    setReport(null);
    setApiError(null);
    setValidationError(null);
  };

  const handleResetDoc = () => {
    setExtractedDoc(null);
    setSelectedFile(null);
    setUploadError(null);
    setImportError(null);
    setPaywalledResolution(null);
    setImportInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // If topic report is generated, render ReportViewer
  if (report) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ReportViewer report={report} onReset={handleResetTopic} />
      </div>
    );
  }

  // If document extraction is complete, render DocumentViewer
  if (extractedDoc) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <DocumentViewer document={extractedDoc} onReset={handleResetDoc} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>New Research Workspace</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
          Start a Research Investigation
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
          Formulate an academic inquiry, upload an academic paper, or import via arXiv, DOI, or direct public URL.
        </p>
      </div>

      {/* Primary Mode Switcher Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => {
            setActiveMode("topic");
            setValidationError(null);
            setApiError(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeMode === "topic"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="h-4 w-4" />
          <span>Topic-Based Analysis</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode("document");
            setUploadError(null);
            setImportError(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeMode === "document"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Research Paper Analysis (PDF / URL / DOI)</span>
        </button>
      </div>

      {/* Tab 1: Topic-Based Investigation */}
      {activeMode === "topic" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <form onSubmit={handleTopicSubmit}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Research Topic & Question
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define the core research question, domain, and scope parameters for structured synthesis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    label="Research Question / Topic"
                    placeholder="e.g. How do transformer attention mechanisms compare to state space models (Mamba) in processing long-context scientific papers?"
                    value={topic}
                    disabled={isLoading}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      if (validationError) setValidationError(null);
                      if (apiError) setApiError(null);
                    }}
                    error={validationError || undefined}
                    helperText="Formulate an inquiry with sufficient specificity for nuanced findings."
                    className="min-h-[120px]"
                  />

                  <Input
                    label="Scope / Key Constraints (Optional)"
                    placeholder="e.g. Focus on computational complexity, memory usage, and benchmark datasets from 2023-2025"
                    value={scope}
                    disabled={isLoading}
                    onChange={(e) => setScope(e.target.value)}
                    helperText="Specify boundaries, time horizons, or domains of interest."
                  />

                  {/* API Error Notification */}
                  {apiError && (
                    <Alert
                      variant={
                        apiError.code === "AI_AUTH_ERROR"
                          ? "warning"
                          : apiError.code === "AI_RATE_LIMIT" || apiError.code === "AI_QUOTA_EXCEEDED"
                          ? "destructive"
                          : "default"
                      }
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-bold">
                        {apiError.code === "AI_AUTH_ERROR"
                          ? "OpenAI Authentication Required"
                          : apiError.code === "AI_RATE_LIMIT"
                          ? "Rate Limit Exceeded"
                          : apiError.code === "AI_QUOTA_EXCEEDED"
                          ? "Quota Limit Reached"
                          : "Inference Error"}
                      </AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed mt-1">
                        {apiError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Loading Feedback Indicator */}
                  {isLoading && (
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        <span>{loadingStep}</span>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    Engine: <strong className="text-foreground">OpenAI Responses API</strong>
                  </span>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="gap-2 text-xs"
                  >
                    <span>Analyze Topic</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-foreground">
                  Traceable Evidence Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Claims generated during topic research are explicitly labeled as{" "}
                <Badge variant="outline" className="text-[10px] font-mono">
                  ai_interpretation
                </Badge>{" "}
                to make clear that topic analysis is model-generated background analysis, not live web research or verified empirical findings.
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Key className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Security Guarantee</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                OpenAI API keys remain strictly on the server. No secrets are ever exposed to client bundles or browser responses.
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Research Paper Ingestion (Upload + Remote Import) */}
      {activeMode === "document" && (
        <div className="space-y-6">
          {/* Ingestion Method Sub-Tabs */}
          <div className="flex gap-2 p-1 bg-muted/40 rounded-lg max-w-fit border border-border">
            <button
              type="button"
              onClick={() => {
                setDocSubMode("upload");
                setUploadError(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                docSubMode === "upload"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Local PDF Upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDocSubMode("import");
                setImportError(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                docSubMode === "import"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Import via URL / arXiv / DOI</span>
              <Badge variant="success" className="text-[9px] px-1 py-0">New</Badge>
            </button>
          </div>

          {/* Sub-Mode A: Local PDF Upload */}
          {docSubMode === "upload" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Upload Academic Document (PDF)
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Page Boundary Engine
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Extract digital text page by page with exact boundary tracking, integrity verification, and scanned document detection.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer group",
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border hover:border-primary/50 bg-card hover:bg-muted/10",
                    selectedFile ? "border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10" : ""
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105",
                      selectedFile
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {selectedFile ? <CheckCircle className="h-6 w-6" /> : <FileUp className="h-6 w-6" />}
                  </div>

                  {selectedFile ? (
                    <div className="space-y-2 max-w-md">
                      <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-md text-xs font-mono text-foreground shadow-xs">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate max-w-[240px] font-semibold">{selectedFile.name}</span>
                        <span className="text-muted-foreground text-[11px]">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="ml-1 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove file</span>
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click or drop another file to replace, or click <strong>Extract Text</strong> below.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-foreground">
                        Select a research paper (PDF) to analyze
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Drag and drop a PDF file here or click to browse. Max file size: 10 MB.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs pointer-events-none"
                        >
                          Select PDF File
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Error Alert */}
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">
                      {uploadError.code === "PAYLOAD_TOO_LARGE"
                        ? "File Too Large"
                        : uploadError.code === "INVALID_FILE_SIGNATURE"
                        ? "Invalid PDF Signature"
                        : uploadError.code === "ENCRYPTED_PDF"
                        ? "Encrypted PDF Unsupported"
                        : "Upload & Extraction Failed"}
                    </AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed mt-1">
                      {uploadError.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Progress Feedback */}
                {isUploading && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      <span>{uploadStep}</span>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  Processing: <strong className="text-foreground">Server-Side unpdf (Zero LLM calls)</strong>
                </span>
                <Button
                  type="button"
                  onClick={handleUploadSubmit}
                  isLoading={isUploading}
                  disabled={isUploading || !selectedFile}
                  className="gap-2 text-xs"
                >
                  <span>Extract Text</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Sub-Mode B: Remote Scholarly Paper Import (Phase 5 Part B) */}
          {docSubMode === "import" && (
            <Card>
              <form onSubmit={handleRemoteImport}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      Import Research Paper by URL, arXiv, or DOI
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      SSRF-Hardened Ingestion
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Fetch publicly accessible scholarly papers and preprints directly into your Research Library.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Input
                    label="Paper Identifier or Public URL"
                    placeholder="e.g. 2301.12345, https://arxiv.org/abs/1706.03762, or 10.1145/3318464.3389700"
                    value={importInput}
                    disabled={isImporting}
                    onChange={(e) => {
                      setImportInput(e.target.value);
                      if (importError) setImportError(null);
                      if (paywalledResolution) setPaywalledResolution(null);
                    }}
                    helperText="Supports arXiv papers, academic DOIs (via Crossref/OpenAlex), and direct HTTPS PDF URLs."
                  />

                  {/* Quick Examples */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Examples:</span>
                    <button
                      type="button"
                      onClick={() => setImportInput("1706.03762")}
                      className="text-[11px] font-mono bg-muted/60 hover:bg-muted text-foreground px-2 py-0.5 rounded border border-border cursor-pointer transition-colors"
                    >
                      1706.03762 (Attention Paper)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportInput("2301.12345")}
                      className="text-[11px] font-mono bg-muted/60 hover:bg-muted text-foreground px-2 py-0.5 rounded border border-border cursor-pointer transition-colors"
                    >
                      2301.12345 (arXiv Preprint)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportInput("10.1145/3318464.3389700")}
                      className="text-[11px] font-mono bg-muted/60 hover:bg-muted text-foreground px-2 py-0.5 rounded border border-border cursor-pointer transition-colors"
                    >
                      10.1145/... (ACM DOI)
                    </button>
                  </div>

                  {/* Error Alert */}
                  {importError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-bold">
                        {importError.code === "SSRF_VIOLATION"
                          ? "Security Block: Restricted Target"
                          : importError.code === "UNSUPPORTED_SOURCE"
                          ? "Unsupported Source Format"
                          : importError.code === "HTML_NOT_PDF"
                          ? "Landing Page / Paywall Detected"
                          : "Import Failed"}
                      </AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed mt-1">
                        {importError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Paywalled / Metadata-Only Resolution Notice */}
                  {paywalledResolution && (
                    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Scholarly Metadata Resolved (Full Text Not Open Access)
                          </CardTitle>
                          <Badge variant="warning" className="text-[10px]">
                            Paywalled
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        {paywalledResolution.metadata?.title && (
                          <div className="font-semibold text-foreground">
                            {paywalledResolution.metadata.title}
                          </div>
                        )}
                        {paywalledResolution.metadata?.authors && (
                          <div className="text-muted-foreground text-[11px]">
                            {paywalledResolution.metadata.authors.join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          {paywalledResolution.metadata?.publicationYear && (
                            <span>Year: {paywalledResolution.metadata.publicationYear}</span>
                          )}
                          {paywalledResolution.metadata?.journalOrConference && (
                            <span>Venue: {paywalledResolution.metadata.journalOrConference}</span>
                          )}
                        </div>
                        <Alert variant="default" className="mt-2 bg-background border-border">
                          <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed">
                            {paywalledResolution.accessNote ||
                              "This publication is behind a publisher paywall. To analyze this document, please obtain the PDF through your university/institutional access and upload it manually."}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between gap-2 border-t border-amber-200/50">
                        {paywalledResolution.landingPageUrl && (
                          <a
                            href={paywalledResolution.landingPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Publisher Page</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDocSubMode("upload");
                            setPaywalledResolution(null);
                          }}
                          className="text-xs gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload PDF Manually</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  )}

                  {/* Progress Stepper */}
                  {isImporting && (
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        <span>{importStep}</span>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  )}

                  {/* SSRF & Security Callout */}
                  <div className="rounded-lg border border-border p-3 text-xs space-y-1 bg-card">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                      <span>SSRF & Remote Ingestion Safeguards</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      All remote requests enforce HTTPS, resolve DNS to block private/loopback IP subnets, limit redirects to 3 hops, verify %PDF- magic bytes, and cap file downloads at 15 MB.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    Providers: <strong className="text-foreground">Crossref • OpenAlex • arXiv • Semantic Scholar</strong>
                  </span>
                  <Button
                    type="submit"
                    isLoading={isImporting}
                    disabled={isImporting || !importInput.trim()}
                    className="gap-2 text-xs"
                  >
                    <span>Resolve & Import Paper</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
