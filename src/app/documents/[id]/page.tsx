import Link from "next/link";
import {
  MessageSquare,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentWorkspaceProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentWorkspacePage({
  params,
}: DocumentWorkspaceProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Workspace: {id === "sample" ? "Document Intelligence Shell" : id}
            </h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              Phase 1 Shell
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Structured analysis workspace illustrating evidence boundaries and grounded document Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/new">
            <Button size="sm" variant="outline" className="text-xs">
              New Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Structured Report Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Report Structure Blueprint
                </span>
                <Badge variant="from_document" className="text-[10px]">
                  evidence-grounded
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1 text-foreground">
                Document Synthesis & Evidence Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Exhibiting how structured analysis results render with explicit evidence citations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Executive Summary Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>Executive Summary</span>
                </h4>
                <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-foreground">
                  The analysis report contract organizes paper insights into verified categories.
                  Every statement is tagged with its evidence origin: document content,
                  retrieved web literature, or AI analytical interpretation.
                </div>
              </div>

              {/* Key Findings with Explicit Evidence Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Key Findings & Evidence Attribution</span>
                </h4>

                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Document-Extracted Fact
                      </span>
                      <Badge variant="from_document" className="text-[10px]">
                        From Document (p. 4)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &ldquo;Multi-head attention allows the model to jointly attend to information
                      from different representation subspaces at different positions.&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Analytical Inference
                      </span>
                      <Badge variant="ai_interpretation" className="text-[10px]">
                        AI Interpretation
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The architecture exhibits a deliberate computational trade-off between
                      parallelism on modern accelerators and memory consumption during inference.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Unanswered Query
                      </span>
                      <Badge variant="not_established" className="text-[10px]">
                        Not Established
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Energy efficiency metrics and carbon footprint comparisons were not reported
                      in the provided paper material.
                    </p>
                  </div>
                </div>
              </div>

              {/* Critical Limitations & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs font-semibold text-foreground">
                    Methodological Strengths
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Reproducible benchmarks, clear mathematical formulations, and empirical validation.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <span className="text-xs font-semibold text-foreground">
                    Identified Research Gaps
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Long-sequence latency degradation and quadratic memory complexity limits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Grounded Q&A Assistant Shell (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    Document-Grounded Q&A
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">Phase 5</Badge>
              </div>
              <CardDescription className="text-xs">
                Ask targeted questions about the extracted document text.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between p-4 space-y-4">
              {/* Intentional Empty Conversation State */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <div className="text-xs font-semibold text-foreground">
                    Grounded Conversation Ready
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once PDF text extraction (Phase 3) and server-side inference (Phase 2 & 5) are active,
                    answers will be generated exclusively from retrieved passages with page citations.
                  </p>
                </div>

                <div className="w-full pt-3 space-y-2 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Example inquiries for this document:
                  </span>
                  <div className="rounded border border-border p-2 text-[11px] text-muted-foreground bg-muted/30 hover:bg-muted/60 transition-colors cursor-default">
                    &ldquo;What optimizer was chosen and what were its hyperparameters?&rdquo;
                  </div>
                  <div className="rounded border border-border p-2 text-[11px] text-muted-foreground bg-muted/30 hover:bg-muted/60 transition-colors cursor-default">
                    &ldquo;What were the primary dataset preprocessing steps?&rdquo;
                  </div>
                </div>
              </div>

              {/* Chat Input Shell */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Document Q&A engine activates in Phase 5..."
                    className="flex-1 h-9 rounded-md border border-input bg-muted/50 px-3 text-xs placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
                  />
                  <Button size="sm" disabled className="h-9 text-xs">
                    Ask
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Strict Grounding: Enabled</span>
                  <span>Anti-Hallucination Guard: Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
