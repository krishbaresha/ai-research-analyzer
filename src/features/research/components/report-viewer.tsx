"use client";

import * as React from "react";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Cpu,
  Calendar,
  HelpCircle,
  FileQuestion,
  Download,
} from "lucide-react";
import { ResearchReport } from "@/types/research";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface ReportViewerProps {
  report: ResearchReport;
  onReset?: () => void;
}

export function ReportViewer({ report, onReset }: ReportViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyMarkdown = () => {
    const findingsText = report.keyFindings
      .map(
        (f, i) =>
          `### ${i + 1}. ${f.finding}\n- **Evidence Source:** ${f.evidenceSource}`
      )
      .join("\n\n");

    const followUpsText = report.suggestedFollowUps
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");

    const markdown = `# ${report.title}

> **Research Question:** ${report.researchQuestion}  
> **Scope:** ${report.scope || "General Literature"}  
> **Evidence Attribution:** ${report.evidenceStatus}  
> **Inference Model:** ${report.modelId}

## Executive Summary
${report.executiveSummary}

## Background & Context
${report.backgroundContext || "N/A"}

## Methodology Overview
${report.methodologyOverview || "N/A"}

## Key Findings
${findingsText}

## Critical Analysis
${report.criticalAnalysis || "N/A"}

## Limitations & Gaps
### Known Limitations
${report.limitations.map((l) => `- ${l}`).join("\n")}

### Unaddressed Research Gaps
${report.researchGaps.map((g) => `- ${g}`).join("\n")}

## Conclusion
${report.conclusion}

## Suggested Follow-up Questions
${followUpsText}
`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    const originalTitle = document.title;
    const cleanTitle = (report.title || "Topic-Research-Report")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60);
    document.title = `${cleanTitle}_Research_Report`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Report Header Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                Structured Research Report
              </Badge>
              <Badge variant={report.evidenceStatus} className="text-[10px]">
                {report.evidenceStatus.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Cpu className="h-3 w-3" />
                {report.modelId}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(report.createdAt)}
              </span>
            </div>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mt-2 leading-tight">
            {report.title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-foreground/80 mt-1 font-medium">
            <span className="text-muted-foreground font-normal">Inquiry:</span>{" "}
            &ldquo;{report.researchQuestion}&rdquo;
          </CardDescription>

          {report.scope && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <strong className="text-foreground">Scope Constraints:</strong> {report.scope}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            All analytical claims are labelled according to evidence boundaries.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="gap-1.5 text-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied Markdown</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </Button>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Query</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Executive Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/90 leading-relaxed space-y-3 whitespace-pre-line">
          {report.executiveSummary}
        </CardContent>
      </Card>

      {/* Background & Methodology Overview */}
      {(report.backgroundContext || report.methodologyOverview) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.backgroundContext && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Background & Foundation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground/80 leading-relaxed">
                {report.backgroundContext}
              </CardContent>
            </Card>
          )}

          {report.methodologyOverview && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Methodology Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground/80 leading-relaxed">
                {report.methodologyOverview}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Key Findings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Key Synthesized Findings ({report.keyFindings.length})</span>
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Categorized by evidence attribution
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {report.keyFindings.map((item, idx) => (
            <Card key={item.id || idx} className="border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <Badge variant={item.evidenceSource} className="text-[10px]">
                      {item.evidenceSource.replace("_", " ")}
                    </Badge>
                  </div>
                  {item.pageReferences && item.pageReferences.length > 0 && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      p. {item.pageReferences.join(", ")}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                  {item.finding}
                </p>

                {item.quote && (
                  <blockquote className="rounded border-l-2 border-primary/40 bg-muted/40 p-2 text-xs italic text-muted-foreground">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Critical Analysis */}
      {report.criticalAnalysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Critical Analysis & Trade-offs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {report.criticalAnalysis}
          </CardContent>
        </Card>
      )}

      {/* Strengths & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.strengths && report.strengths.length > 0 && (
          <Card className="border-emerald-200/50 dark:border-emerald-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Strengths in Existing Literature</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                {report.strengths.map((str, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="text-foreground">{str}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {report.limitations && report.limitations.length > 0 && (
          <Card className="border-amber-200/50 dark:border-amber-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Known Limitations & Boundary Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                {report.limitations.map((lim, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="text-foreground">{lim}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Research Gaps */}
      {report.researchGaps && report.researchGaps.length > 0 && (
        <Card className="border-purple-200/50 dark:border-purple-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />
              <span>Unaddressed Research Gaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
              {report.researchGaps.map((gap, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="text-foreground">{gap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Conclusion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Synthesized Conclusion</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          {report.conclusion}
        </CardContent>
      </Card>

      {/* Suggested Follow-up Questions */}
      {report.suggestedFollowUps && report.suggestedFollowUps.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Suggested Follow-Up Inquiries</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Concrete research angles for deeper empirical or theoretical exploration:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {report.suggestedFollowUps.map((question, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-3 text-xs text-foreground/90 leading-relaxed shadow-sm flex items-start gap-2"
                >
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  <span>{question}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
