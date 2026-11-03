"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileUp,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  FileText,
  Layers,
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
import { cn } from "@/lib/utils";

type Mode = "topic" | "document";

export default function NewResearchPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "document" ? "document" : "topic";
  const [activeMode, setActiveMode] = React.useState<Mode>(initialMode);

  // Form state
  const [topic, setTopic] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please provide a research topic or academic question.");
      return;
    }
    setError(null);
    // In Phase 1, UI states are demonstrated without fabricating mock backend data
  };

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
            setError(null);
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
            setError(null);
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
          <div className="lg:col-span-2">
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
                    onChange={(e) => {
                      setTopic(e.target.value);
                      if (error) setError(null);
                    }}
                    error={error || undefined}
                    helperText="Formulate an inquiry with sufficient specificity for nuanced findings."
                    className="min-h-[120px]"
                  />

                  <Input
                    label="Scope / Key Constraints (Optional)"
                    placeholder="e.g. Focus on computational complexity, memory usage, and benchmark datasets from 2023-2025"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    helperText="Specify boundaries, time horizons, or domains of interest."
                  />

                  <Alert variant="info" className="text-xs">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Phase 1 Boundary Notice</AlertTitle>
                    <AlertDescription>
                      In Phase 1, form validation and UI shell are active. Live server-side inference
                      via Groq (`openai/gpt-oss-120b`) activates in Phase 2.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    Model: <strong className="text-foreground">openai/gpt-oss-120b</strong>
                  </span>
                  <Button type="submit" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Research Plan</span>
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
                  <span>Executive Summary & Assumptions</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Methodology & Key Findings</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Critical Strengths & Limitations</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Research Gaps & Follow-ups</span>
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
                Claims without direct document backing will be explicitly tagged as{" "}
                <Badge variant="ai_interpretation" className="text-[10px] my-1">
                  ai_interpretation
                </Badge>{" "}
                to prevent unverified assertions from masquerading as verified facts.
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: PDF Document Upload */}
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
              {/* Dropzone Shell */}
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

              {/* Extraction Expectations & Constraints */}
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
