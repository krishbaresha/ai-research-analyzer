"use client";

import * as React from "react";
import {
  ResearchExplorerData,
  ReadingMode,
} from "@/types/research-explorer";
import { ExtractedDocument } from "@/types/document";
import { ResearchIdentityCard } from "./research-identity-card";
import { ExecutiveCanvas } from "./executive-canvas";
import { AtAGlanceGrid } from "./at-a-glance-grid";
import { ReconstructedChartsView } from "./reconstructed-charts-view";
import { WorkflowDiagramView } from "./workflow-diagram-view";
import { ExplorerSectionsView } from "./explorer-sections-view";
import { TechnicalGlossaryView } from "./technical-glossary-view";
import { AmbientChatDock } from "./ambient-chat-dock";
import { OutlineNav, OutlineNavItem } from "./outline-nav";
import {
  Compass,
  Sparkles,
  Target,
  BarChart3,
  Layers,
  BookOpen,
  GitBranch,
} from "lucide-react";

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

  const navItems: OutlineNavItem[] = [
    { id: "identity", label: "Identity", icon: Compass },
    { id: "executive", label: "Overview", icon: Sparkles },
    { id: "glance", label: "At a Glance", icon: Target },
    ...(explorerData.reconstructedCharts && explorerData.reconstructedCharts.length > 0
      ? [{ id: "charts", label: "Charts", count: explorerData.reconstructedCharts.length, icon: BarChart3 }]
      : []),
    ...(explorerData.workflowDiagrams && explorerData.workflowDiagrams.length > 0
      ? [{ id: "workflow", label: "Workflow", count: explorerData.workflowDiagrams.length, icon: GitBranch }]
      : []),
    { id: "dimensions", label: "30 Dimensions", count: explorerData.sections.length, icon: BookOpen },
    { id: "glossary", label: "Glossary", count: explorerData.glossary?.length || 0, icon: Layers },
  ];

  const scrollTo = (id: string) => {
    setActiveNav(id);
    const element = window.document.getElementById(`ra-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll-spy observer tracking active visible section
  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cleanId = entry.target.id.replace("ra-", "");
            setActiveNav(cleanId);
          }
        });
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    );

    const sectionIds = [
      "ra-identity",
      "ra-executive",
      "ra-glance",
      ...(explorerData.reconstructedCharts?.length ? ["ra-charts"] : []),
      ...(explorerData.workflowDiagrams?.length ? ["ra-workflow"] : []),
      "ra-dimensions",
      "ra-glossary",
    ];

    sectionIds.forEach((id) => {
      const el = window.document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [explorerData]);

  return (
    <div className="space-y-6 relative">
      {/* Sticky High-Density Outline Navigation Rail */}
      <OutlineNav
        items={navItems}
        activeId={activeNav}
        onNavigate={scrollTo}
        readingMode={readingMode}
        onReadingModeChange={setReadingMode}
        onPrintPdf={handlePrintPdf}
        onExportWord={handleExportWordDoc}
        onViewPages={onViewPages}
        onOpenChat={() => {
          setAmbientChatQuery(undefined);
          setIsAmbientChatOpen(true);
        }}
      />

      {/* 1. Research Identity Canvas */}
      <section id="ra-identity" className="scroll-mt-20">
        <ResearchIdentityCard
          identity={explorerData.identity}
          onOpenPdf={onViewPages}
        />
      </section>

      {/* 2. Executive Research Canvas */}
      <section id="ra-executive" className="scroll-mt-20">
        <ExecutiveCanvas
          overview={explorerData.executiveOverview}
          readingMode={readingMode}
        />
      </section>

      {/* 3. Research At a Glance Grid */}
      <section id="ra-glance" className="scroll-mt-20">
        <AtAGlanceGrid
          glance={explorerData.atAGlance}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* 4. Reconstructed Visual Charts (Zero hallucination, verified tables only) */}
      <section id="ra-charts" className="scroll-mt-20">
        <ReconstructedChartsView
          charts={explorerData.reconstructedCharts || []}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* 5. Methodological Workflow Stages */}
      {explorerData.workflowDiagrams && explorerData.workflowDiagrams.length > 0 && (
        <section id="ra-workflow" className="scroll-mt-20">
          <WorkflowDiagramView
            diagrams={explorerData.workflowDiagrams}
            onSelectPage={onSelectPage}
          />
        </section>
      )}

      {/* 6. Comprehensive 30-Dimension Explorer */}
      <section id="ra-dimensions" className="scroll-mt-20">
        <ExplorerSectionsView
          sections={explorerData.sections}
          readingMode={readingMode}
          onSelectPage={onSelectPage}
          onAskAssistant={handleOpenChatWithQuery}
        />
      </section>

      {/* 7. Technical Academic Glossary */}
      <section id="ra-glossary" className="scroll-mt-20">
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
