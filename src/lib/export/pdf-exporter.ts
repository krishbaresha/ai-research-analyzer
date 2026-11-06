import { jsPDF } from "jspdf";
import { ResearchExplorerData } from "@/types/research-explorer";
import { ExtractedDocument } from "@/types/document";
import { ResearchReport, DocumentAnalysisReport } from "@/types/research";

interface PdfCursor {
  y: number;
}

const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 174mm
const BOTTOM_LIMIT = PAGE_HEIGHT - 22;

function checkPageBreak(doc: jsPDF, cursor: PdfCursor, requiredHeight: number) {
  if (cursor.y + requiredHeight > BOTTOM_LIMIT) {
    doc.addPage();
    cursor.y = 20;
    return true;
  }
  return false;
}

function addWatermarkAndFooters(doc: jsPDF, docTitle: string) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Top subtle header line (except cover/first page)
    if (i > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        docTitle.length > 60 ? docTitle.slice(0, 60) + "..." : docTitle,
        MARGIN_LEFT,
        12
      );
      doc.text("AI Research Analyzer", PAGE_WIDTH - MARGIN_RIGHT, 12, { align: "right" });
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.2);
      doc.line(MARGIN_LEFT, 14, PAGE_WIDTH - MARGIN_RIGHT, 14);
    }

    // Bottom footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Evidence-Grounded Research Exploration", MARGIN_LEFT, PAGE_HEIGHT - 9);
    doc.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH - MARGIN_RIGHT,
      PAGE_HEIGHT - 9,
      { align: "right" }
    );
  }
}

/**
 * Generates and downloads a clean, publication-grade academic PDF for Research Explorer.
 */
export function exportResearchExplorerToPdf(
  explorerData: ResearchExplorerData,
  extractedDoc: ExtractedDocument
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const cursor: PdfCursor = { y: 22 };
  const paperTitle = explorerData.identity.title || extractedDoc.metadata.sanitizedFilename || "Research Paper";

  // --- 1. COVER / HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(MARGIN_LEFT, cursor.y, CONTENT_WIDTH, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // Sky 400
  doc.text("ACADEMIC RESEARCH INTELLIGENCE REPORT", MARGIN_LEFT + 6, cursor.y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Domain: ${explorerData.identity.researchDomain || "Academic Research"}  |  Generated: ${new Date().toLocaleDateString()}`,
    MARGIN_LEFT + 6,
    cursor.y + 16
  );
  doc.text(
    `Pages Analyzed: ${explorerData.identity.pageCount}  |  Source: ${explorerData.identity.sourceType || "upload"}`,
    MARGIN_LEFT + 6,
    cursor.y + 21
  );

  cursor.y += 34;

  // --- 2. PAPER TITLE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(paperTitle, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN_LEFT, cursor.y);
  cursor.y += titleLines.length * 6 + 4;

  // Authors & Metadata Bar
  const authors = (explorerData.identity.authors || []).join(", ");
  if (authors) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // Slate 600
    const authorLines = doc.splitTextToSize(`Authors: ${authors}`, CONTENT_WIDTH);
    doc.text(authorLines, MARGIN_LEFT, cursor.y);
    cursor.y += authorLines.length * 4.5 + 2;
  }

  const metaItems: string[] = [];
  if (explorerData.identity.publicationYear) metaItems.push(`Year: ${explorerData.identity.publicationYear}`);
  if (explorerData.identity.journalOrConference) metaItems.push(`Venue: ${explorerData.identity.journalOrConference}`);
  if (explorerData.identity.doi) metaItems.push(`DOI: ${explorerData.identity.doi}`);
  if (explorerData.identity.arxivId) metaItems.push(`arXiv: ${explorerData.identity.arxivId}`);

  if (metaItems.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(metaItems.join("  |  "), MARGIN_LEFT, cursor.y);
    cursor.y += 6;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, cursor.y, MARGIN_LEFT + CONTENT_WIDTH, cursor.y);
  cursor.y += 8;

  // --- 3. EXECUTIVE RESEARCH OVERVIEW ---
  checkPageBreak(doc, cursor, 45);
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(MARGIN_LEFT, cursor.y, CONTENT_WIDTH, 48, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144); // Cyan 700
  doc.text("Executive Research Overview", MARGIN_LEFT + 5, cursor.y + 7);

  const exec = explorerData.executiveOverview;
  let subY = cursor.y + 13;

  const renderExecLine = (label: string, text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${label}: `, MARGIN_LEFT + 5, subY);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 10 - labelWidth);
    doc.text(lines, MARGIN_LEFT + 5 + labelWidth, subY);
    subY += Math.max(lines.length * 4, 5);
  };

  renderExecLine("Core Problem", exec.problemAddressed);
  renderExecLine("Intuition", exec.beginnerExplanation);
  renderExecLine("Key Discovery", exec.whatDiscovered);
  renderExecLine("Contribution", exec.technicalContribution);

  cursor.y += 54;

  // --- 4. RESEARCH AT A GLANCE (METRIC BOXES) ---
  checkPageBreak(doc, cursor, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Research At a Glance", MARGIN_LEFT, cursor.y);
  cursor.y += 5;

  const glance = explorerData.atAGlance;
  const glanceCards = [
    { label: "Core Objective", data: glance.coreObjective },
    { label: "Methodology", data: glance.methodologyApproach },
    { label: "Dataset / Sample", data: glance.datasetOrSample },
    { label: "Empirical Result", data: glance.keyEmpiricalResult },
    { label: "Limitations", data: glance.primaryLimitations },
  ];

  const colWidth = (CONTENT_WIDTH - 4) / 2; // 2 columns
  for (let i = 0; i < glanceCards.length; i += 2) {
    checkPageBreak(doc, cursor, 22);
    const card1 = glanceCards[i];
    const card2 = glanceCards[i + 1];

    const renderCard = (x: number, c: typeof card1) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cursor.y, colWidth, 18, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(14, 116, 144);
      doc.text(c.label.toUpperCase(), x + 4, cursor.y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const headline = doc.splitTextToSize(c.data.headline, colWidth - 8);
      doc.text(headline[0] || "", x + 4, cursor.y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const detail = doc.splitTextToSize(c.data.detail, colWidth - 8);
      doc.text(detail[0] || "", x + 4, cursor.y + 13.5);
    };

    renderCard(MARGIN_LEFT, card1);
    if (card2) {
      renderCard(MARGIN_LEFT + colWidth + 4, card2);
    }
    cursor.y += 22;
  }

  cursor.y += 4;

  // --- 5. COMPREHENSIVE 30-DIMENSION EXPLORATION ---
  checkPageBreak(doc, cursor, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Structured Research Dimensions", MARGIN_LEFT, cursor.y);
  cursor.y += 6;

  explorerData.sections.forEach((sec, idx) => {
    checkPageBreak(doc, cursor, 35);

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${sec.title}`, MARGIN_LEFT, cursor.y);

    // Status Badge text
    const statusText = `[${sec.evidenceStatus.replace("_", " ").toUpperCase()}]`;
    const pageText = sec.pageReferences && sec.pageReferences.length > 0
      ? `Pages: ${sec.pageReferences.join(", ")}`
      : "Not Reported";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (sec.evidenceStatus === "from_document") {
      doc.setTextColor(16, 185, 129); // Emerald
    } else if (sec.evidenceStatus === "ai_interpretation") {
      doc.setTextColor(217, 119, 6); // Amber
    } else {
      doc.setTextColor(100, 116, 139); // Slate
    }
    doc.text(`${statusText}  •  ${pageText}`, MARGIN_LEFT + CONTENT_WIDTH, cursor.y, { align: "right" });

    cursor.y += 5;

    // Technical Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const techLines = doc.splitTextToSize(sec.researcherTechnical, CONTENT_WIDTH);
    doc.text(techLines, MARGIN_LEFT, cursor.y);
    cursor.y += techLines.length * 4 + 2;

    // Beginner Intuition
    if (sec.beginnerExplanation) {
      checkPageBreak(doc, cursor, 14);
      doc.setFillColor(240, 249, 255); // Sky 50
      doc.setDrawColor(186, 230, 253); // Sky 200
      const begLines = doc.splitTextToSize(`Intuition: ${sec.beginnerExplanation}`, CONTENT_WIDTH - 6);
      const boxH = begLines.length * 3.8 + 4;
      doc.roundedRect(MARGIN_LEFT, cursor.y, CONTENT_WIDTH, boxH, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(3, 105, 161); // Sky 700
      doc.text(begLines, MARGIN_LEFT + 3, cursor.y + 3.5);
      cursor.y += boxH + 2;
    }

    // Direct Quote if present
    if (sec.quote) {
      checkPageBreak(doc, cursor, 12);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const quoteLines = doc.splitTextToSize(`"${sec.quote}"`, CONTENT_WIDTH - 8);
      doc.setDrawColor(203, 213, 225);
      doc.line(MARGIN_LEFT + 2, cursor.y, MARGIN_LEFT + 2, cursor.y + quoteLines.length * 3.8);
      doc.text(quoteLines, MARGIN_LEFT + 5, cursor.y + 3);
      cursor.y += quoteLines.length * 3.8 + 3;
    }

    // Subtle divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, cursor.y, MARGIN_LEFT + CONTENT_WIDTH, cursor.y);
    cursor.y += 4;
  });

  // --- 6. WORKFLOW DIAGRAMS (IF AVAILABLE) ---
  if (explorerData.workflowDiagrams && explorerData.workflowDiagrams.length > 0) {
    checkPageBreak(doc, cursor, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Methodology Workflow Pipelines", MARGIN_LEFT, cursor.y);
    cursor.y += 6;

    explorerData.workflowDiagrams.forEach((diag) => {
      checkPageBreak(doc, cursor, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(14, 116, 144);
      doc.text(diag.title, MARGIN_LEFT, cursor.y);
      cursor.y += 4.5;

      diag.steps.forEach((step, sIdx) => {
        checkPageBreak(doc, cursor, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`Step ${step.stepNumber || sIdx + 1}: ${step.title}`, MARGIN_LEFT + 4, cursor.y);
        cursor.y += 3.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(step.description, CONTENT_WIDTH - 8);
        doc.text(descLines, MARGIN_LEFT + 8, cursor.y);
        cursor.y += descLines.length * 3.5 + 2;
      });
      cursor.y += 3;
    });
  }

  // --- 7. TECHNICAL GLOSSARY (IF AVAILABLE) ---
  if (explorerData.glossary && explorerData.glossary.length > 0) {
    checkPageBreak(doc, cursor, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Technical Glossary", MARGIN_LEFT, cursor.y);
    cursor.y += 6;

    explorerData.glossary.forEach((item) => {
      checkPageBreak(doc, cursor, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.term}:`, MARGIN_LEFT, cursor.y);
      const tWidth = doc.getTextWidth(`${item.term}: `);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const defLines = doc.splitTextToSize(
        item.plainDefinition || item.technicalDefinition,
        CONTENT_WIDTH - tWidth
      );
      doc.text(defLines, MARGIN_LEFT + tWidth, cursor.y);
      cursor.y += defLines.length * 4 + 2;
    });
  }

  // Finalize header & footers across all generated pages
  addWatermarkAndFooters(doc, paperTitle);

  // Direct file download into browser's Downloads directory
  const sanitized = (paperTitle.replace(/[^a-zA-Z0-9_-]/g, "_")).slice(0, 35);
  doc.save(`${sanitized}_Research_Report.pdf`);
}

/**
 * Generates and downloads a clean, publication-grade academic PDF for Topic-Based Research.
 */
export function exportTopicResearchToPdf(report: ResearchReport) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const cursor: PdfCursor = { y: 22 };
  const topicTitle = report.title || report.researchQuestion || "Research Topic";

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN_LEFT, cursor.y, CONTENT_WIDTH, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text("ACADEMIC TOPIC SYNTHESIS REPORT", MARGIN_LEFT + 6, cursor.y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Scope: ${report.scope || "General Inquiry"}  |  Date: ${new Date().toLocaleDateString()}`, MARGIN_LEFT + 6, cursor.y + 16);

  cursor.y += 32;

  // Topic Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(topicTitle, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN_LEFT, cursor.y);
  cursor.y += titleLines.length * 6 + 6;

  // Executive Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144);
  doc.text("Executive Summary", MARGIN_LEFT, cursor.y);
  cursor.y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, CONTENT_WIDTH);
  doc.text(summaryLines, MARGIN_LEFT, cursor.y);
  cursor.y += summaryLines.length * 4.5 + 8;

  // Core Findings
  if (report.keyFindings && report.keyFindings.length > 0) {
    checkPageBreak(doc, cursor, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text("Core Empirical Findings", MARGIN_LEFT, cursor.y);
    cursor.y += 6;

    report.keyFindings.forEach((finding, idx) => {
      checkPageBreak(doc, cursor, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${finding.finding}`, MARGIN_LEFT, cursor.y);
      cursor.y += 4.5;

      if (finding.quote) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const qLines = doc.splitTextToSize(`"${finding.quote}"`, CONTENT_WIDTH - 6);
        doc.text(qLines, MARGIN_LEFT + 4, cursor.y);
        cursor.y += qLines.length * 4 + 2;
      }
    });
  }

  addWatermarkAndFooters(doc, topicTitle);

  const sanitized = topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 35);
  doc.save(`${sanitized}_Topic_Research.pdf`);
}

/**
 * Generates and downloads a clean academic PDF for Phase 4 Document Analysis.
 */
export function exportDocumentAnalysisToPdf(
  report: DocumentAnalysisReport,
  docFilename: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const cursor: PdfCursor = { y: 22 };
  const paperTitle = report.overview?.title || docFilename || "Academic Analysis";

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN_LEFT, cursor.y, CONTENT_WIDTH, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text("GROUNDED DOCUMENT ANALYSIS REPORT", MARGIN_LEFT + 6, cursor.y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Document: ${docFilename}  |  Generated: ${new Date().toLocaleDateString()}`, MARGIN_LEFT + 6, cursor.y + 16);

  cursor.y += 32;

  // Paper Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(paperTitle, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN_LEFT, cursor.y);
  cursor.y += titleLines.length * 6 + 6;

  // Executive Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144);
  doc.text("Executive Summary", MARGIN_LEFT, cursor.y);
  cursor.y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, CONTENT_WIDTH);
  doc.text(summaryLines, MARGIN_LEFT, cursor.y);
  cursor.y += summaryLines.length * 4.5 + 8;

  // Methodology Assessment
  if (report.methodologyAssessment) {
    checkPageBreak(doc, cursor, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text("Research Methodology & Design", MARGIN_LEFT, cursor.y);
    cursor.y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const mLines = doc.splitTextToSize(report.methodologyAssessment.approach, CONTENT_WIDTH);
    doc.text(mLines, MARGIN_LEFT, cursor.y);
    cursor.y += mLines.length * 4 + 6;
  }

  // Key Findings
  if (report.keyFindings && report.keyFindings.length > 0) {
    checkPageBreak(doc, cursor, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text("Key Results & Evidence", MARGIN_LEFT, cursor.y);
    cursor.y += 5;

    report.keyFindings.forEach((res, idx) => {
      checkPageBreak(doc, cursor, 15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${res.finding}`, MARGIN_LEFT, cursor.y);
      cursor.y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const pText = res.pageReferences && res.pageReferences.length > 0 ? ` [Pages ${res.pageReferences.join(", ")}]` : "";
      const dLines = doc.splitTextToSize(`${res.quote || res.confidenceNotes || ""}${pText}`, CONTENT_WIDTH);
      doc.text(dLines, MARGIN_LEFT + 4, cursor.y);
      cursor.y += dLines.length * 3.8 + 3;
    });
  }

  addWatermarkAndFooters(doc, paperTitle);

  const sanitized = paperTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 35);
  doc.save(`${sanitized}_Document_Analysis.pdf`);
}
