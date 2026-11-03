import { MetadataProvider } from "./provider.interface";
import { ScholarlyMetadata } from "@/types/import";

/**
 * Normalizes any arXiv input (URL or raw ID) into a clean canonical arXiv ID.
 * Examples:
 *   "https://arxiv.org/abs/2301.12345" -> "2301.12345"
 *   "https://arxiv.org/pdf/2301.12345.pdf" -> "2301.12345"
 *   "arxiv:2301.12345v2" -> "2301.12345"
 *   "2301.12345" -> "2301.12345"
 *   "math/0306123" -> "math/0306123"
 */
export function normalizeArxivId(input: string): string | null {
  const trimmed = input.trim();

  // Pattern: https://arxiv.org/abs/2301.12345 or https://arxiv.org/pdf/2301.12345.pdf
  const urlMatch = trimmed.match(/arxiv\.org\/(?:abs|pdf)\/([a-z\-]+(?:\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Pattern: arxiv:2301.12345
  const prefixMatch = trimmed.match(/^arxiv:\s*([a-z\-]+(?:\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?/i);
  if (prefixMatch) {
    return prefixMatch[1];
  }

  // Direct modern ID: 2301.12345 or 2301.12345v2
  const directMatch = trimmed.match(/^(\d{4}\.\d{4,5})(?:v\d+)?$/);
  if (directMatch) {
    return directMatch[1];
  }

  // Direct legacy ID: math/0306123 or hep-th/9901001
  const legacyMatch = trimmed.match(/^([a-z\-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/i);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  return null;
}

/**
 * arXiv Metadata Provider.
 * Fetches official paper metadata and open-access PDF links from the arXiv API.
 */
export class ArxivProvider implements MetadataProvider {
  readonly name = "arxiv";

  async resolveMetadata(input: string): Promise<ScholarlyMetadata | null> {
    const arxivId = normalizeArxivId(input);
    if (!arxivId) return null;

    const apiUrl = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AIResearchAnalyzer/1.0 (mailto:academic-tools@researchanalyzer.local)",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return this.buildFallbackMetadata(arxivId);
      }

      const xml = await response.text();

      // Extract entry content
      const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
      if (!entryMatch) {
        return this.buildFallbackMetadata(arxivId);
      }

      const entryContent = entryMatch[1];

      // Title
      const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : undefined;

      // Authors
      const authorMatches = [...entryContent.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)];
      const authors = authorMatches.map((m) => m[1].trim()).filter((a) => a.length > 0);

      // Published Year
      const publishedMatch = entryContent.match(/<published>(\d{4})-/);
      const publicationYear = publishedMatch ? parseInt(publishedMatch[1], 10) : undefined;

      // Abstract/Summary
      const summaryMatch = entryContent.match(/<summary>([\s\S]*?)<\/summary>/);
      const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : undefined;

      // DOI if available in arXiv entry
      const doiMatch = entryContent.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/);
      const doi = doiMatch ? doiMatch[1].trim() : undefined;

      // Direct PDF URL
      const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

      return {
        title: title || `arXiv:${arxivId}`,
        authors: authors.length > 0 ? authors : undefined,
        publicationYear,
        journalOrConference: "arXiv Preprint",
        doi,
        arxivId,
        abstract,
        pdfUrl,
        landingPageUrl: `https://arxiv.org/abs/${arxivId}`,
        openAccessStatus: "green",
        metadataProvider: "arxiv",
      };
    } catch {
      clearTimeout(timeout);
      return this.buildFallbackMetadata(arxivId);
    }
  }

  private buildFallbackMetadata(arxivId: string): ScholarlyMetadata {
    return {
      title: `arXiv:${arxivId}`,
      arxivId,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      landingPageUrl: `https://arxiv.org/abs/${arxivId}`,
      openAccessStatus: "green",
      metadataProvider: "arxiv",
    };
  }
}

export const arxivProvider = new ArxivProvider();
