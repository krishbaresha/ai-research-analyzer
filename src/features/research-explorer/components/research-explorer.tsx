"use client";

import * as React from "react";
import {
  FileText,
  Download,
  BookOpen,
  MessageSquare,
  Sparkles,
  Layers,
  GraduationCap,
  Microscope,
  Share2,
  Printer,
  ChevronDown,
} from "lucide-react";
import {
  ResearchExplorerData,
  ReadingMode,
} from "@/types/research-explorer";
import { ExtractedDocument } from "@/types/document";
import { BrandSymbol } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResearchIdentityCard } from "./research-identity-card";
import { ExecutiveCanvas } from "./executive-canvas";
import { AtAGlanceGrid } from "./at-a-glance-grid";
import { ReconstructedChartsView } from "./reconstructed-charts-view";
import { WorkflowDiagramView } from "./workflow-diagram-view";
import { ExplorerSectionsView } from "./explorer-sections-view";
import { TechnicalGlossaryView } from "./technical-glossary-view";
import { AmbientChatDock } from "./ambient-chat-dock";
import { cn } from "@/lib/utils";

interface ResearchExplorerProps {
  document: ExtractedDocument;
  explorerData: ResearchExplorerData;
  onSelectPage?: (pageNumber: number) => void;
  onViewPages?: () => void;
}

export function ResearchExplorer({
  document: extractedDoc,
  explorerData,
  onSelectPage,
  onViewPages,
}: ResearchExplorerProps) {
  const [readingMode, setReadingMode] = React.useState<ReadingMode>("beginner");
  const [isAmbientChatOpen, setIsAmbientChatOpen] = React.useState(false);
  const [ambientChatQuery, setAmbientChatQuery] = React.useState<string | undefined>(undefined);
  const [activeNav, setActiveNav] = React.useState<string>("identity");

  const handleOpenChatWithQuery = (title: string, contextText: string) => {
    setAmbientChatQuery(`Could you explain "${title}" in more detail based on the paper? Context: "${contextText.slice(0, 140)}..."`);
    setIsAmbientChatOpen(true);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportWordDoc = () => {
    const title = explorerData.identity.title || extractedDoc.metadata.sanitizedFilename;
    const authors = (explorerData.identity.authors || []).join(", ");
    const sectionsHtml = explorerData.sections
      .map(
        (s) => `
        <div style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
          <h3 style="color: #1e3a8a; font-size: 16px; margin-bottom: 4px;">${s.title}</h3>
          <p style="font-size: 11px; color: #64748b; margin-top: 0;">Evidence Status: <strong>${s.evidenceStatus}</strong> | Source Pages: ${s.pageReferences && s.pageReferences.length > 0 ? "Pages " + s.pageReferences.join(", ") : "Not specified"}</p>
          <p style="font-size: 13px; color: #1e293b; line-height: 1.6;">${s.researcherTechnical}</p>
          ${s.beginnerExplanation ? `<p style="font-size: 12px; color: #0284c7; background: #f0f9ff; padding: 8px; border-radius: 4px;"><strong>Intuition:</strong> ${s.beginnerExplanation}</p>` : ""}
          ${s.quote ? `<blockquote style="border-left: 3px solid #cbd5e1; padding-left: 10px; font-style: italic; font-size: 12px; color: #475569;">"${s.quote}"</blockquote>` : ""}
        </div>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} - Research Explorer</title>
          <style>
            body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }
            h1 { color: #0f172a; font-size: 22px; margin-bottom: 6px; }
            h2 { color: #2563eb; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-top: 30px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 25px; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 11px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            ${authors ? `<p><strong>Authors:</strong> ${authors}</p>` : ""}
            <p><strong>Research Domain:</strong> ${explorerData.identity.researchDomain || "Academic Research"} | <strong>Pages:</strong> ${explorerData.identity.pageCount}</p>
            <p><strong>Published Date / Year:</strong> ${explorerData.identity.publicationYear || "Document Record"}</p>
          </div>

          <div class="card">
            <h3 style="margin-top:0; color: #1e40af;">Executive Research Overview</h3>
            <p><strong>Core Problem:</strong> ${explorerData.executiveOverview.problemAddressed}</p>
            <p><strong>Plain-Language Intuition:</strong> ${explorerData.executiveOverview.beginnerExplanation}</p>
            <p><strong>Key Discovery:</strong> ${explorerData.executiveOverview.whatDiscovered}</p>
            <p><strong>Primary Contribution:</strong> ${explorerData.executiveOverview.technicalContribution}</p>
          </div>

          <h2>Comprehensive Academic Exploration (30 Dimensions)</h2>
          ${sectionsHtml}

          <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Generated by Research Analyzer &bull; Traceable Academic Intelligence
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${(extractedDoc.metadata.title || extractedDoc.metadata.sanitizedFilename).slice(0, 40)}_analysis.doc`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "identity", label: "Identity" },
    { id: "executive", label: "Overview" },
    { id: "glance", label: "At a Glance" },
    ...(explorerData.reconstructedCharts && explorerData.reconstructedCharts.length > 0
      ? [{ id: "charts", label: `Charts (${explorerData.reconstructedCharts.length})` }]
      : []),
    ...(explorerData.workflowDiagrams && explorerData.workflowDiagrams.length > 0
      ? [{ id: "workflow", label: `Workflow (${explorerData.workflowDiagrams.length})` }]
      : []),
    { id: "dimensions", label: "30 Dimensions" },
    { id: "glossary", label: `Glossary (${explorerData.glossary?.length || 0})` },
  ];

  const scrollTo = (id: string) => {
    setActiveNav(id);
    const element = window.document.getElementById(`ra-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Top Controls & Reading Mode Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border border-border rounded-xl p-2.5 sm:px-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Navigation jump pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer",
                activeNav === item.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side: Mode Switcher & Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Reading Mode Switcher */}
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setReadingMode("beginner")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                readingMode === "beginner"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Plain english explanations, intuitive analogies, and beginner guidance"
            >
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Beginner</span>
            </button>
            <button
              type="button"
              onClick={() => setReadingMode("researcher")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                readingMode === "researcher"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Methodological rigor, mathematical formulas, and scientific precision"
            >
              <Microscope className="h-3.5 w-3.5 text-blue-600" />
              <span>Researcher</span>
            </button>
          </div>

          {/* Export Dropdown / Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              className="h-8 gap-1.5 text-xs"
              title="Print or Save as Vector PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWordDoc}
              className="h-8 gap-1.5 text-xs"
              title="Download Word Document (.doc)"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Word</span>
            </Button>
            {onViewPages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewPages}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="View Raw Extracted Pages"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pages</span>
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setAmbientChatQuery(undefined);
                setIsAmbientChatOpen(true);
              }}
              className="h-8 gap-1.5 text-xs shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask Paper AI</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Research Identity Canvas */}
      <section id="ra-identity" className="scroll-mt-16">
        <ResearchIdentityCard
          identity={explorerData.identity}
          onOpenPdf={onViewPages}
        />
      </section>

      {/* 2. Executive Research Canvas */}
      <section id="ra-executive" className="scroll-mt-16">
        <ExecutiveCanvas
          overview={explorerData.executiveOverview}
          readingMode={readingMode}
        />
      </section>

      {/* 3. Research At a Glance Grid */}
      <section id="ra-glance" className="scroll-mt-16">
        <AtAGlanceGrid
          glance={explorerData.atAGlance}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* 4. Reconstructed Visual Charts (Zero hallucination, verified tables only) */}
      <section id="ra-charts" className="scroll-mt-16">
        <ReconstructedChartsView
          charts={explorerData.reconstructedCharts || []}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* 5. Methodological Workflow Stages */}
      {explorerData.workflowDiagrams && explorerData.workflowDiagrams.length > 0 && (
        <section id="ra-workflow" className="scroll-mt-16">
          <WorkflowDiagramView
            diagrams={explorerData.workflowDiagrams}
            onSelectPage={onSelectPage}
          />
        </section>
      )}

      {/* 6. Comprehensive 30-Dimension Explorer */}
      <section id="ra-dimensions" className="scroll-mt-16">
        <ExplorerSectionsView
          sections={explorerData.sections}
          readingMode={readingMode}
          onSelectPage={onSelectPage}
          onAskAssistant={handleOpenChatWithQuery}
        />
      </section>

      {/* 7. Technical Academic Glossary */}
      <section id="ra-glossary" className="scroll-mt-16">
        <TechnicalGlossaryView
          glossary={explorerData.glossary || []}
          readingMode={readingMode}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* Ambient Slideout Chat Dock */}
      <AmbientChatDock
        document={extractedDoc}
        isOpen={isAmbientChatOpen}
        onClose={() => setIsAmbientChatOpen(false)}
        onSelectPage={(pageNum) => {
          setIsAmbientChatOpen(false);
          onSelectPage?.(pageNum);
        }}
        initialQuery={ambientChatQuery}
      />
    </div>
  );
}
