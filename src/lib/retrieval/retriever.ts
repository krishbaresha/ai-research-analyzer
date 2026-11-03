import { ExtractedDocument, ExtractedPage } from "@/types/document";

export interface DocumentChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  text: string;
  charCount: number;
  wordCount: number;
}

export interface ScoredChunk extends DocumentChunk {
  score: number;
  matchedTerms: string[];
}

export interface RetrievalResult {
  passages: ScoredChunk[];
  pagesSearched: number;
  pagesUsed: number[];
  partialCoverage: boolean;
  totalChunksSearched: number;
  queryKeywords: string[];
  hasRelevantPassages: boolean;
}

export interface RetrievalOptions {
  maxPassages?: number;
  maxCharsTotal?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  minScoreThreshold?: number;
}

const DEFAULT_CHUNK_SIZE = 900;
const DEFAULT_CHUNK_OVERLAP = 150;
const DEFAULT_MAX_PASSAGES = 5;
const DEFAULT_MAX_CHARS = 10000;
const DEFAULT_MIN_SCORE = 0.1;

// Common academic English stop words to filter from query tokenization
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
  "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
  "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
  "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
  "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what",
  "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
  "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
  "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  "paper", "document", "tell", "explain", "describe", "discuss", "show", "give",
]);

/**
 * Tokenizes text into normalized lower-case keywords.
 */
export function tokenizeKeywords(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  return Array.from(new Set(words));
}

/**
 * Detects if query explicitly requests a specific page (e.g. "page 4", "on p. 2").
 */
export function extractRequestedPageNumber(query: string): number | null {
  const match = query.match(/\b(?:page|p\.?)\s*(\d+)\b/i);
  if (match && match[1]) {
    const pageNum = parseInt(match[1], 10);
    return isNaN(pageNum) ? null : pageNum;
  }
  return null;
}

/**
 * Chunks a single page's text into overlapping passages preserving page number.
 */
export function chunkPage(
  page: ExtractedPage,
  documentId: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): DocumentChunk[] {
  const text = page.text.trim();
  if (!text) return [];

  if (text.length <= chunkSize) {
    return [
      {
        id: `chk_${documentId}_p${page.pageNumber}_0`,
        documentId,
        pageNumber: page.pageNumber,
        text,
        charCount: text.length,
        wordCount: page.wordCount,
      },
    ];
  }

  const chunks: DocumentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < text.length) {
      // Find clean sentence or newline boundary
      const lookahead = text.slice(startIndex, endIndex + 100);
      const sentenceBoundary = lookahead.lastIndexOf(". ");
      const newlineBoundary = lookahead.lastIndexOf("\n");
      const splitPoint = Math.max(sentenceBoundary, newlineBoundary);

      if (splitPoint > chunkSize * 0.7) {
        endIndex = startIndex + splitPoint + 1;
      }
    } else {
      endIndex = text.length;
    }

    const chunkText = text.slice(startIndex, endIndex).trim();
    if (chunkText.length > 0) {
      chunks.push({
        id: `chk_${documentId}_p${page.pageNumber}_${chunkIndex}`,
        documentId,
        pageNumber: page.pageNumber,
        text: chunkText,
        charCount: chunkText.length,
        wordCount: chunkText.split(/\s+/).filter(Boolean).length,
      });
      chunkIndex++;
    }

    if (endIndex >= text.length) break;
    startIndex = endIndex - overlap;
    if (startIndex >= text.length) break;
  }

  return chunks;
}

/**
 * Chunks all pages of an ExtractedDocument.
 */
export function chunkDocument(
  document: ExtractedDocument,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const page of document.pages) {
    chunks.push(...chunkPage(page, document.metadata.id, chunkSize, overlap));
  }
  return chunks;
}

/**
 * Server-side, lightweight, deterministic BM25-inspired passage retriever.
 * Searches across ALL extracted pages of the document.
 */
export function retrieveRelevantPassages(
  document: ExtractedDocument,
  query: string,
  options: RetrievalOptions = {}
): RetrievalResult {
  const maxPassages = options.maxPassages ?? DEFAULT_MAX_PASSAGES;
  const maxCharsTotal = options.maxCharsTotal ?? DEFAULT_MAX_CHARS;
  const minScore = options.minScoreThreshold ?? DEFAULT_MIN_SCORE;
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const totalPages = document.metadata.pageCount || document.pages.length;
  const allChunks = chunkDocument(document, chunkSize, chunkOverlap);

  if (allChunks.length === 0) {
    return {
      passages: [],
      pagesSearched: totalPages,
      pagesUsed: [],
      partialCoverage: false,
      totalChunksSearched: 0,
      queryKeywords: [],
      hasRelevantPassages: false,
    };
  }

  const queryTerms = tokenizeKeywords(query);
  const requestedPage = extractRequestedPageNumber(query);

  // If query is too generic and no requested page, return empty
  if (queryTerms.length === 0 && requestedPage === null) {
    return {
      passages: [],
      pagesSearched: totalPages,
      pagesUsed: [],
      partialCoverage: false,
      totalChunksSearched: allChunks.length,
      queryKeywords: [],
      hasRelevantPassages: false,
    };
  }

  // Pre-calculate Document Frequency (DF) for each query term across all chunks
  const dfMap = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const chunk of allChunks) {
      if (chunk.text.toLowerCase().includes(term)) {
        count++;
      }
    }
    dfMap.set(term, count);
  }

  const totalChunks = allChunks.length;
  const avgChunkLen = allChunks.reduce((acc, c) => acc + c.charCount, 0) / totalChunks;
  const k1 = 1.2;
  const b = 0.75;

  const scoredChunks: ScoredChunk[] = [];

  for (const chunk of allChunks) {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    const matchedTerms: string[] = [];

    // Keyword scoring
    for (const term of queryTerms) {
      // Count term occurrences (TF)
      const regex = new RegExp(`\\b${term}\\b`, "g");
      const matches = chunkLower.match(regex);
      const tf = matches ? matches.length : 0;

      if (tf > 0) {
        matchedTerms.push(term);
        const df = dfMap.get(term) || 1;
        // Standard BM25 IDF
        const idf = Math.log(1 + (totalChunks - df + 0.5) / (df + 0.5));
        // BM25 term weight
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (chunk.charCount / avgChunkLen));
        score += idf * (numerator / denominator);
      }
    }

    // Boost if user explicitly asked for this page (e.g. "on page 5")
    if (requestedPage !== null && chunk.pageNumber === requestedPage) {
      score += 15.0;
      matchedTerms.push(`page:${requestedPage}`);
    }

    if (score >= minScore) {
      scoredChunks.push({
        ...chunk,
        score,
        matchedTerms,
      });
    }
  }

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Select top-ranked passages bounded by maxPassages and maxCharsTotal
  const selectedPassages: ScoredChunk[] = [];
  let totalCharsUsed = 0;
  const seenPages = new Set<number>();

  for (const chunk of scoredChunks) {
    if (selectedPassages.length >= maxPassages) break;
    if (totalCharsUsed + chunk.charCount > maxCharsTotal && selectedPassages.length > 0) {
      continue;
    }

    selectedPassages.push(chunk);
    totalCharsUsed += chunk.charCount;
    seenPages.add(chunk.pageNumber);
  }

  // Sort selected passages chronologically by page number for cohesive reading
  selectedPassages.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    return a.id.localeCompare(b.id);
  });

  const pagesUsed = Array.from(seenPages).sort((a, b) => a - b);

  return {
    passages: selectedPassages,
    pagesSearched: totalPages,
    pagesUsed,
    partialCoverage: false, // In Phase 5, all pages are searched
    totalChunksSearched: allChunks.length,
    queryKeywords: queryTerms,
    hasRelevantPassages: selectedPassages.length > 0,
  };
}
