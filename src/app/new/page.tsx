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
  Layers,
  AlertCircle,
  Key,
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
import { ReportViewer } from "@/features/research/components/report-viewer";

type Mode = "topic" | "document";

interface ApiErrorPayload {
  code: string;
  message: string;
}

export default function NewResearchPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "document" ? "document" : "topic";
  const [activeMode, setActiveMode] = React.useState<Mode>(initialMode);

  // Form input state
  const [topic, setTopic] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Async submission state
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState("Initiating inquiry...");
  const [apiError, setApiError] = React.useState<ApiErrorPayload | null>(null);
  const [report, setReport] = React.useState<ResearchReport | null>(null);

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

  const handleReset = () => {
    setReport(null);
    setApiError(null);
    setValidationError(null);
  };

  // If report is generated, render the complete structured report
  if (report) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ReportViewer report={report} onReset={handleReset} />
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
          Formulate a research inquiry for AI synthesis or upload an academic paper for grounded extraction.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
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
            setValidationError(null);
            setApiError(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeMode === "document"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileUp className="h-4 w-4" />
          <span>PDF Document Analysis</span>
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
                          ? "OpenAI API Key Required"
                          : apiError.code === "AI_RATE_LIMIT"
                          ? "OpenAI Rate Limit Exceeded"
                          : apiError.code === "AI_QUOTA_EXCEEDED"
                          ? "OpenAI Quota Exceeded"
                          : "Inference Error"}
                      </AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed space-y-1 mt-1">
                        <p>{apiError.message}</p>
                        {apiError.code === "AI_AUTH_ERROR" && (
                          <div className="mt-2 rounded bg-background/80 p-2 font-mono text-[11px] text-foreground border border-border">
                            Add to <code>.env.local</code>:
                            <br />
                            <code>OPENAI_API_KEY=your_openai_api_key_here</code>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Loading State Feedback */}
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
                    Inference: <strong className="text-foreground">Server-Side OpenAI Responses API</strong>
                  </span>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run Analysis</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Analysis Blueprint / Scope Preview */}
          <div className="space-y-4">
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Report Output Schema</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Your analysis will be structured into verifiable sections:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Research Overview & Executive Summary</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Key Findings & Evidence Attribution</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Methodology & Detailed Analysis</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Limitations, Gaps & Further Research</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-amber-50/20 dark:bg-amber-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  <span>Evidence Integrity Standard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Claims are explicitly labelled as{" "}
                <Badge variant="ai_interpretation" className="text-[10px] my-1">
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

      {/* Tab 2: PDF Document Upload (Phase 3 preview) */}
      {activeMode === "document" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Upload Academic Document (PDF)
              </CardTitle>
              <CardDescription className="text-xs">
                Extract page-partitioned text and generate evidence-grounded reports with exact citations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 sm:p-12 text-center bg-card transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FileUp className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Select a research paper (PDF) to analyze
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Drag and drop a PDF file here or click to browse. Max file size: 10 MB.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs pointer-events-none">
                    Select File
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Page Boundary Mapping</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Extracted text preserves page numbers so analytical citations link directly to specific passages.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    <span>Scanned PDF Disclaimer</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Optical Character Recognition (OCR) is not included in MVP. Image-only PDFs will be flagged honestly.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                Document Parsing Engine: Phase 3
              </span>
              <Button disabled className="gap-2 text-xs">
                <span>Upload & Extract</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
