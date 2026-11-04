import { SourceResolutionResult, ScholarlyMetadata } from "@/types/import";
import { normalizeArxivId, arxivProvider } from "./providers/arxiv";
import { crossrefProvider } from "./providers/crossref";
import { openAlexProvider } from "./providers/openalex";
import { semanticScholarProvider } from "./providers/semanticscholar";

/**
 * Regex patterns for identifying scholarly inputs.
 */
const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/i;
const DIRECT_PDF_URL_REGEX = /^https:\/\/[^\s/$.?#].[^\s]*\.pdf(?:\?[^\s]*)?$/i;

/**
 * Normalizes a DOI string from raw input or URL.
 */
export function extractDoi(input: string): string | null {
  const match = input.match(DOI_REGEX);
  if (!match) return null;
  // Clean trailing punctuation often caught by regex in text
  return match[1].replace(/[.,;)]+$/, "");
}

/**
 * Resolves an arbitrary user input string (URL, arXiv ID, or DOI) into
 * structured scholarly metadata and potential open-access PDF download location.
 */
export async function resolveSource(rawInput: string): Promise<SourceResolutionResult> {
  const trimmed = rawInput.trim();

  // 1. Detect arXiv paper
  const arxivId = normalizeArxivId(trimmed);
  if (arxivId) {
    const metadata = await arxivProvider.resolveMetadata(trimmed);
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

    return {
      detectedType: "arxiv",
      normalizedIdentifier: arxivId,
      rawInput: trimmed,
      metadata: metadata || undefined,
      pdfUrl,
      isOpenAccess: true,
      fullTextAvailable: true,
      landingPageUrl: `https://arxiv.org/abs/${arxivId}`,
    };
  }

  // 2. Detect DOI
  const doi = extractDoi(trimmed);
  if (doi) {
    // Attempt multi-provider resolution with OpenAlex first (best OA link coverage)
    let metadata: ScholarlyMetadata | null = null;

    try {
      metadata = await openAlexProvider.resolveMetadata(doi);
    } catch {
      // Fallback
    }

    if (!metadata || !metadata.pdfUrl) {
      try {
        const crossrefMeta = await crossrefProvider.resolveMetadata(doi);
        if (crossrefMeta) {
          metadata = {
            ...crossrefMeta,
            // Keep OpenAlex OA pdf if Crossref doesn't have one
            pdfUrl: crossrefMeta.pdfUrl || metadata?.pdfUrl,
            openAccessStatus: crossrefMeta.pdfUrl ? "gold" : metadata?.openAccessStatus || "unknown",
          };
        }
      } catch {
        // Fallback
      }
    }

    if (!metadata || !metadata.pdfUrl) {
      try {
        const s2Meta = await semanticScholarProvider.resolveMetadata(doi);
        if (s2Meta) {
          metadata = {
            ...metadata,
            ...s2Meta,
            pdfUrl: s2Meta.pdfUrl || metadata?.pdfUrl,
          };
        }
      } catch {
        // Fallback
      }
    }

    const hasPdf = Boolean(metadata?.pdfUrl && metadata.pdfUrl.startsWith("https://"));

    return {
      detectedType: "doi",
      normalizedIdentifier: doi,
      rawInput: trimmed,
      metadata: metadata || undefined,
      pdfUrl: metadata?.pdfUrl,
      isOpenAccess: hasPdf,
      fullTextAvailable: hasPdf,
      landingPageUrl: `https://doi.org/${doi}`,
      accessNote: hasPdf
        ? undefined
        : "Full text is not publicly accessible via open access repositories for this DOI. You can upload the paper PDF manually.",
    };
  }

  // 3. Detect Google Books URLs (web viewer pages with DRM/copyrighted HTML)
  if (/books\.google\.[a-z.]+/i.test(trimmed)) {
    return {
      detectedType: "unsupported",
      normalizedIdentifier: trimmed,
      rawInput: trimmed,
      isOpenAccess: false,
      fullTextAvailable: false,
      landingPageUrl: trimmed,
      accessNote:
        "Google Books links are copyright-protected web viewer pages, not downloadable PDF documents. To analyze this book, please upload the PDF/chapter file directly via 'Local PDF Upload', or explore the topic using 'Topic-Based Analysis'.",
    };
  }

  // 4. Detect direct PDF URL
  if (DIRECT_PDF_URL_REGEX.test(trimmed)) {
    // Generate clean title guess from URL basename
    let guessedTitle: string | undefined;
    try {
      const parsed = new URL(trimmed);
      const filename = parsed.pathname.split("/").pop()?.replace(/\.pdf$/i, "");
      if (filename) {
        guessedTitle = decodeURIComponent(filename).replace(/[-_]+/g, " ");
      }
    } catch {
      // Ignore
    }

    return {
      detectedType: "direct_url",
      normalizedIdentifier: trimmed,
      rawInput: trimmed,
      pdfUrl: trimmed,
      isOpenAccess: true,
      fullTextAvailable: true,
      landingPageUrl: trimmed,
      metadata: {
        title: guessedTitle,
        pdfUrl: trimmed,
        landingPageUrl: trimmed,
        metadataProvider: "direct",
        openAccessStatus: "unknown",
      },
    };
  }

  // 4. General HTTPS URL fallback
  if (trimmed.startsWith("https://")) {
    return {
      detectedType: "direct_url",
      normalizedIdentifier: trimmed,
      rawInput: trimmed,
      pdfUrl: trimmed,
      isOpenAccess: true,
      fullTextAvailable: true,
      landingPageUrl: trimmed,
      metadata: {
        pdfUrl: trimmed,
        landingPageUrl: trimmed,
        metadataProvider: "direct",
      },
    };
  }

  return {
    detectedType: "unsupported",
    normalizedIdentifier: trimmed,
    rawInput: trimmed,
    isOpenAccess: false,
    fullTextAvailable: false,
    accessNote: "Unsupported format. Please enter a valid HTTPS PDF URL, arXiv paper URL/ID, or DOI.",
  };
}
