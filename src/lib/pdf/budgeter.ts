import { ExtractedDocument, ExtractedPage } from "@/types/document";

export interface BudgetedPassage {
  pageNumber: number;
  text: string;
  charCount: number;
  wordCount: number;
}

export interface BudgetedDocument {
  passages: BudgetedPassage[];
  analyzedPages: number[];
  totalPages: number;
  coveragePercentage: number;
  isPartialCoverage: boolean;
  totalCharsUsed: number;
  coverageNote?: string;
}

/**
 * Maximum character budget for document prompt ingestion.
 * 60,000 characters is ~15,000 tokens, providing high-fidelity coverage
 * while avoiding latency bottlenecks or context degradation.
 */
export const DEFAULT_MAX_CHAR_BUDGET = 60000;

/**
 * Sanitizes passage text to prevent XML delimiter collision and prompt injection.
 */
export function sanitizePassageText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<\/document_passage>/gi, "[/document_passage]")
    .replace(/<document_passage[^>]*>/gi, "[document_passage]")
    .replace(/<\/user_topic>/gi, "[/user_topic]")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .trim();
}

/**
 * Budgets extracted document pages to fit safely within model context bounds
 * without losing page tracking or arbitrary front/back truncation.
 */
export function budgetDocumentPages(
  document: ExtractedDocument,
  maxCharBudget: number = DEFAULT_MAX_CHAR_BUDGET
): BudgetedDocument {
  const { pages, metadata } = document;
  const totalPages = metadata.pageCount || pages.length;

  // Filter out pages that have zero text
  const validPages = pages.filter((p) => p.text && p.text.trim().length > 0);

  if (validPages.length === 0) {
    return {
      passages: [],
      analyzedPages: [],
      totalPages,
      coveragePercentage: 0,
      isPartialCoverage: true,
      totalCharsUsed: 0,
      coverageNote: "Document contains no extractable digital text (OCR required).",
    };
  }

  // Calculate total characters across all valid pages
  const totalChars = validPages.reduce((acc, p) => acc + p.charCount, 0);

  // If entire document fits within context budget, retain all pages
  if (totalChars <= maxCharBudget) {
    const passages = validPages.map((p) => ({
      pageNumber: p.pageNumber,
      text: sanitizePassageText(p.text),
      charCount: p.charCount,
      wordCount: p.wordCount,
    }));

    const analyzedPages = passages.map((p) => p.pageNumber).sort((a, b) => a - b);
    const coveragePercentage = Math.round((analyzedPages.length / totalPages) * 100);

    return {
      passages,
      analyzedPages,
      totalPages,
      coveragePercentage,
      isPartialCoverage: analyzedPages.length < totalPages,
      totalCharsUsed: totalChars,
    };
  }

  // For long documents exceeding budget:
  // Strategically sample key architectural sections:
  // 1. Initial pages (Abstract, Intro, Objectives)
  // 2. Concluding pages (Discussion, Conclusion, Gaps)
  // 3. Evenly spaced intermediate pages (Methodology & Results)
  const selectedPagesMap = new Map<number, ExtractedPage>();
  let currentBudgetUsed = 0;

  // Step A: Priority to first 3 pages
  for (let i = 0; i < Math.min(3, validPages.length); i++) {
    const page = validPages[i];
    if (currentBudgetUsed + page.charCount <= maxCharBudget) {
      selectedPagesMap.set(page.pageNumber, page);
      currentBudgetUsed += page.charCount;
    }
  }

  // Step B: Priority to final 2 pages
  for (let i = Math.max(3, validPages.length - 2); i < validPages.length; i++) {
    const page = validPages[i];
    if (!selectedPagesMap.has(page.pageNumber) && currentBudgetUsed + page.charCount <= maxCharBudget) {
      selectedPagesMap.set(page.pageNumber, page);
      currentBudgetUsed += page.charCount;
    }
  }

  // Step C: Evenly distributed intermediate pages for the remaining budget
  const remainingPages = validPages.filter((p) => !selectedPagesMap.has(p.pageNumber));
  if (remainingPages.length > 0) {
    const step = Math.max(1, Math.floor(remainingPages.length / 5));
    for (let i = 0; i < remainingPages.length; i += step) {
      const page = remainingPages[i];
      if (currentBudgetUsed + page.charCount <= maxCharBudget) {
        selectedPagesMap.set(page.pageNumber, page);
        currentBudgetUsed += page.charCount;
      }
    }
  }

  const selectedPages = Array.from(selectedPagesMap.values()).sort(
    (a, b) => a.pageNumber - b.pageNumber
  );

  const passages: BudgetedPassage[] = selectedPages.map((p) => ({
    pageNumber: p.pageNumber,
    text: sanitizePassageText(p.text),
    charCount: p.charCount,
    wordCount: p.wordCount,
  }));

  const analyzedPages = passages.map((p) => p.pageNumber);
  const coveragePercentage = Math.round((analyzedPages.length / totalPages) * 100);

  const coverageNote = `Analyzed ${analyzedPages.length} of ${totalPages} pages (${coveragePercentage}% coverage) prioritizing introduction, methodology, and conclusion.`;

  return {
    passages,
    analyzedPages,
    totalPages,
    coveragePercentage,
    isPartialCoverage: true,
    totalCharsUsed: currentBudgetUsed,
    coverageNote,
  };
}
