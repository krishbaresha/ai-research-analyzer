"use client";

import * as React from "react";
import {
  BookOpen,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  Copy,
  Check,
  Bookmark,
  Activity,
  HelpCircle,
  FileText,
  ShieldCheck,
  Download,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DocumentReportViewerProps {
  report: DocumentAnalysisReport;
  onSelectPage?: (pageNumber: number) => void;
}

export function DocumentReportViewer({
  report,
  onSelectPage,
}: DocumentReportViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const { overview } = report;

  const handleCopyMarkdown = () => {
    const findingsMd = report.keyFindings
      .map(
        (f, i) =>
          `### ${i + 1}. ${f.finding}\n- **Evidence Source:** ${f.evidenceSource}\n- **Pages:** ${
            f.pageReferences?.length ? f.pageReferences.join(", ") : "N/A"
          }\n${f.quote ? `- **Quote:** "${f.quote}"\n` : ""}`
      )
      .join("\n");

    const sectionsMd = report.detailedAnalysis
      .map(
        (s) =>
          `### ${s.heading} (Pages: ${
            s.pageReferences?.length ? s.pageReferences.join(", ") : "N/A"
          })\n${s.content}\n`
      )
      .join("\n");

    const conceptsMd = report.importantConcepts
      .map(
        (c) =>
          `- **${c.term}** (p. ${c.pageReferences?.join(", ") || "N/A"}): ${c.definition}`
      )
      .join("\n");

    const markdown = `# ${overview.title}

> **Document:** ${overview.originalFilename}  
> **Pages Analyzed:** ${overview.analyzedPages.join(", ")} of ${overview.totalPages} (${overview.coveragePercentage}% coverage)  
> **Model:** ${report.modelId}  
> **Generated:** ${report.generatedAt}

## Executive Summary
${report.executiveSummary}

## Research Objectives
${report.researchObjectives.map((o) => `- ${o.objective} (Pages: ${o.pageReferences?.join(", ") || "N/A"})`).join("\n")}

## Key Findings
${findingsMd}

## Methodology Assessment
- **Approach:** ${report.methodologyAssessment.approach}
- **Datasets:** ${report.methodologyAssessment.datasetsUsed.join(", ") || "None listed"}
- **Baselines:** ${report.methodologyAssessment.baselines.join(", ") || "None listed"}
- **Metrics:** ${report.methodologyAssessment.evaluationMetrics.join(", ") || "None listed"}
- **Rigor:** ${report.methodologyAssessment.methodologicalRigor}

## Detailed Analysis
${sectionsMd}

## Important Concepts
${conceptsMd}

## Strengths
${report.strengths.map((s) => `- ${s}`).join("\n")}

## Weaknesses
${report.weaknesses.map((w) => `- ${w}`).join("\n")}

## Limitations
${report.limitations.map((l) => `- ${l}`).join("\n")}

## Research Gaps
${report.researchGaps.map((g) => `- ${g}`).join("\n")}

## Conclusion
${report.conclusion}

## Suggested Further Research
${report.suggestedFurtherResearch.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    const originalTitle = document.title;
    const cleanTitle = (overview.title || "Research-Analysis-Report")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60);
    document.title = `${cleanTitle}_Analysis_Report`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadWord = () => {
    const cleanTitle = (overview.title || "Research-Analysis-Report")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60);

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${overview.title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 30px; }
          h1 { color: #1e3a8a; font-size: 20pt; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 15px; }
          h2 { color: #0f172a; font-size: 14pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; }
          h3 { color: #1e40af; font-size: 12pt; margin-top: 14px; }
          p { margin: 6px 0; }
          .meta-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 10px 14px; margin-bottom: 20px; font-size: 10pt; }
          .citation-badge { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 9pt; }
          .quote-box { background: #f8fafc; border-left: 3px solid #10b981; padding: 6px 12px; margin: 6px 0; font-style: italic; color: #334155; }
          ul, ol { margin: 6px 0 12px 20px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>${overview.title}</h1>
        <div class="meta-box">
          <p><strong>Document:</strong> ${overview.originalFilename}</p>
          <p><strong>Analyzed Coverage:</strong> ${overview.analyzedPages.join(", ")} of ${overview.totalPages} pages (${overview.coveragePercentage}% full-text coverage)</p>
          <p><strong>Model:</strong> ${report.modelId} | <strong>Date:</strong> ${report.generatedAt}</p>
        </div>

        <h2>Executive Summary</h2>
        <p>${report.executiveSummary.replace(/\n\n/g, "</p><p>")}</p>

        <h2>Research Objectives</h2>
        <ul>
          ${report.researchObjectives.map((o) => `<li><strong>${o.objective}</strong> <span class="citation-badge">[Page ${o.pageReferences?.join(", ") || "N/A"}]</span></li>`).join("")}
        </ul>

        <h2>Key Findings</h2>
        ${report.keyFindings.map((f, i) => `
          <div style="margin-bottom: 10px;">
            <p><strong>${i + 1}. ${f.finding}</strong> <span class="citation-badge">[Page ${f.pageReferences?.join(", ") || "N/A"}]</span></p>
            ${f.quote ? `<div class="quote-box">&ldquo;${f.quote}&rdquo;</div>` : ""}
          </div>
        `).join("")}

        <h2>Methodology Assessment</h2>
        <p><strong>Approach:</strong> ${report.methodologyAssessment.approach}</p>
        <p><strong>Datasets:</strong> ${report.methodologyAssessment.datasetsUsed.join(", ") || "None listed"}</p>
        <p><strong>Baselines:</strong> ${report.methodologyAssessment.baselines.join(", ") || "None listed"}</p>
        <p><strong>Evaluation Metrics:</strong> ${report.methodologyAssessment.evaluationMetrics.join(", ") || "None listed"}</p>
        <p><strong>Rigor:</strong> ${report.methodologyAssessment.methodologicalRigor}</p>

        <h2>Detailed Analysis</h2>
        ${report.detailedAnalysis.map((s) => `
          <h3>${s.heading} <span class="citation-badge">[Page ${s.pageReferences?.join(", ") || "N/A"}]</span></h3>
          <p>${s.content.replace(/\n\n/g, "</p><p>")}</p>
        `).join("")}

        <h2>Important Concepts</h2>
        <ul>
          ${report.importantConcepts.map((c) => `<li><strong>${c.term}</strong> <span class="citation-badge">[p. ${c.pageReferences?.join(", ") || "N/A"}]</span>: ${c.definition}</li>`).join("")}
        </ul>

        <h2>Strengths & Limitations</h2>
        <p><strong>Empirical Strengths:</strong></p>
        <ul>${report.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
        <p><strong>Limitations:</strong></p>
        <ul>${report.limitations.map((l) => `<li>${l}</li>`).join("")}</ul>
        <p><strong>Identified Research Gaps:</strong></p>
        <ul>${report.researchGaps.map((g) => `<li>${g}</li>`).join("")}</ul>

        <h2>Conclusion</h2>
        <p>${report.conclusion}</p>

        <h2>Suggested Further Research</h2>
        <ol>${report.suggestedFurtherResearch.map((r) => `<li>${r}</li>`).join("")}</ol>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanTitle}_Report.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderCitationPill = (pages?: number[]) => {
    if (!pages || pages.length === 0) return null;

    return (
      <span className="inline-flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onSelectPage?.(p)}
            title={`Jump to Page ${p}`}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
          >
            <Bookmark className="h-2.5 w-2.5" />
            <span>p. {p}</span>
          </button>
        ))}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Overview Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="from_document" className="text-[10px]">
                Evidence-Grounded Document Analysis
              </Badge>
              {overview.isPartialCoverage ? (
                <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300">
                  Partial Coverage ({overview.coveragePercentage}%)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  Full Document Coverage (100%)
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPdf}
                className="gap-1.5 text-xs h-8 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadWord}
                className="gap-1.5 text-xs h-8 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Download Word</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="gap-1.5 text-xs h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied Report</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-2">
            {overview.title}
          </CardTitle>
          <CardDescription className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span>Source: <strong>{overview.originalFilename}</strong></span>
            <span>Analyzed Pages: <strong>{overview.analyzedPages.join(", ")}</strong> of {overview.totalPages}</span>
            <span>Model: <code className="font-mono text-[11px]">{report.modelId}</code></span>
          </CardDescription>
        </CardHeader>

        {overview.isPartialCoverage && (
          <CardContent className="pt-4">
            <Alert variant="warning" className="text-xs py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <AlertTitle className="text-xs font-semibold">Long Document Budget Notice</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed">
                This report analyzed {overview.analyzedPages.length} out of {overview.totalPages} pages ({overview.coveragePercentage}% coverage)
                prioritizing core introductory, methodological, and concluding sections to fit model context bounds without losing page tracking.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Executive Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
          {report.executiveSummary}
        </CardContent>
      </Card>

      {/* Research Objectives */}
      {report.researchObjectives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>Research Objectives & Hypotheses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.researchObjectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border bg-card text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">{i + 1}.</span>
                  <span className="text-foreground">{obj.objective}</span>
                </div>
                {renderCitationPill(obj.pageReferences)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Findings & Evidence Attribution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Key Findings & Grounded Citations</span>
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Click page pills to inspect source</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.keyFindings.map((finding, idx) => (
            <div
              key={finding.id || idx}
              className="rounded-lg border border-border p-3.5 space-y-2 bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Finding {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={finding.evidenceSource} className="text-[10px]">
                    {finding.evidenceSource}
                  </Badge>
                  {renderCitationPill(finding.pageReferences)}
                </div>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {finding.finding}
              </p>
              {finding.quote && (
                <div className="rounded border-l-2 border-primary/50 bg-muted/40 px-3 py-1.5 text-[11px] italic text-muted-foreground">
                  &ldquo;{finding.quote}&rdquo;
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Methodology Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Methodology Assessment</span>
            </CardTitle>
            {renderCitationPill(report.methodologyAssessment.pageReferences)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-foreground block mb-1">Approach:</span>
            <p className="text-muted-foreground leading-relaxed">{report.methodologyAssessment.approach}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded border border-border p-2.5 space-y-1">
              <span className="font-semibold text-foreground text-[11px] block">Datasets:</span>
              <div className="flex flex-wrap gap-1">
                {report.methodologyAssessment.datasetsUsed.length > 0 ? (
                  report.methodologyAssessment.datasetsUsed.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono">{d}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-[11px]">None specified</span>
                )}
              </div>
            </div>

            <div className="rounded border border-border p-2.5 space-y-1">
              <span className="font-semibold text-foreground text-[11px] block">Baselines:</span>
              <div className="flex flex-wrap gap-1">
                {report.methodologyAssessment.baselines.length > 0 ? (
                  report.methodologyAssessment.baselines.map((b, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono">{b}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-[11px]">None specified</span>
                )}
              </div>
            </div>

            <div className="rounded border border-border p-2.5 space-y-1">
              <span className="font-semibold text-foreground text-[11px] block">Evaluation Metrics:</span>
              <div className="flex flex-wrap gap-1">
                {report.methodologyAssessment.evaluationMetrics.length > 0 ? (
                  report.methodologyAssessment.evaluationMetrics.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono">{m}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-[11px]">None specified</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="font-semibold text-foreground block mb-1">Methodological Rigor Evaluation:</span>
            <p className="text-muted-foreground leading-relaxed">{report.methodologyAssessment.methodologicalRigor}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Sections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Detailed Analytical Synthesis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.detailedAnalysis.map((section, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 space-y-2 bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="text-xs font-bold text-foreground">
                  {section.heading}
                </h4>
                {renderCitationPill(section.pageReferences)}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {section.content}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Important Concepts */}
      {report.importantConcepts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              <span>Key Concepts & Formulations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {report.importantConcepts.map((concept, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1.5 bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">{concept.term}</span>
                  {renderCitationPill(concept.pageReferences)}
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {concept.definition}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strengths & Weaknesses Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Methodological Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {report.strengths.map((str, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{str}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Identified Weaknesses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {report.weaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>{w}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Limitations & Research Gaps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Stated Limitations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {report.limitations.map((lim, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                <span>{lim}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>Unaddressed Research Gaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {report.researchGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                <span>{gap}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Conclusion & Suggested Further Research */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Conclusion & Further Research Directions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="leading-relaxed text-foreground whitespace-pre-wrap">{report.conclusion}</p>

          <div className="pt-3 border-t border-border space-y-2">
            <span className="font-semibold text-foreground text-xs block">Suggested Follow-Up Inquiries:</span>
            {report.suggestedFurtherResearch.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-muted-foreground">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
