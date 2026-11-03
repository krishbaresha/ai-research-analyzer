import { MetadataProvider } from "./provider.interface";
import { ScholarlyMetadata } from "@/types/import";

/**
 * Semantic Scholar Metadata Provider.
 * Secondary/fallback adapter using the Semantic Scholar Academic Graph API.
 */
export class SemanticScholarProvider implements MetadataProvider {
  readonly name = "semanticscholar";

  async resolveMetadata(doiOrId: string): Promise<ScholarlyMetadata | null> {
    const cleanDoi = doiOrId.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    if (!cleanDoi) return null;

    const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(cleanDoi)}?fields=title,authors,year,venue,openAccessPdf`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AIResearchAnalyzer/1.0 (mailto:academic-tools@researchanalyzer.local)",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data) return null;

      const title = typeof data.title === "string" ? data.title : undefined;

      const authors = Array.isArray(data.authors)
        ? data.authors
            .map((a: { name?: string }) => a.name || "")
            .filter((name: string) => name.length > 0)
        : undefined;

      const publicationYear = typeof data.year === "number" ? data.year : undefined;
      const journalOrConference = typeof data.venue === "string" ? data.venue : undefined;

      let pdfUrl: string | undefined;
      if (data.openAccessPdf?.url && data.openAccessPdf.url.startsWith("https://")) {
        pdfUrl = data.openAccessPdf.url;
      }

      return {
        title,
        authors: authors && authors.length > 0 ? authors : undefined,
        publicationYear,
        journalOrConference,
        doi: cleanDoi,
        pdfUrl,
        landingPageUrl: `https://doi.org/${cleanDoi}`,
        openAccessStatus: pdfUrl ? "gold" : "unknown",
        metadataProvider: "semanticscholar",
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
}

export const semanticScholarProvider = new SemanticScholarProvider();
