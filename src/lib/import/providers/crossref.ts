import { MetadataProvider } from "./provider.interface";
import { ScholarlyMetadata } from "@/types/import";

/**
 * Crossref Metadata Provider.
 * Resolves academic DOI records using Crossref's public REST API.
 */
export class CrossrefProvider implements MetadataProvider {
  readonly name = "crossref";

  async resolveMetadata(doi: string): Promise<ScholarlyMetadata | null> {
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    if (!cleanDoi) return null;

    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
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

      const json = await response.json();
      const message = json?.message;
      if (!message) return null;

      const title = Array.isArray(message.title) && message.title.length > 0 ? message.title[0] : undefined;

      const authors = Array.isArray(message.author)
        ? message.author
            .map((a: { given?: string; family?: string; name?: string }) => {
              if (a.name) return a.name;
              if (a.given && a.family) return `${a.given} ${a.family}`;
              return a.family || a.given || "";
            })
            .filter((name: string) => name.length > 0)
        : undefined;

      let publicationYear: number | undefined;
      const dateParts = message.published?.["date-parts"]?.[0] || message.created?.["date-parts"]?.[0];
      if (Array.isArray(dateParts) && typeof dateParts[0] === "number") {
        publicationYear = dateParts[0];
      }

      const journalOrConference =
        Array.isArray(message["container-title"]) && message["container-title"].length > 0
          ? message["container-title"][0]
          : undefined;

      // Extract direct Open Access PDF links if registered
      let pdfUrl: string | undefined;
      if (Array.isArray(message.link)) {
        const pdfLink = message.link.find(
          (l: { "content-type"?: string; URL?: string }) =>
            l["content-type"] === "application/pdf" && l.URL?.startsWith("https://")
        );
        if (pdfLink?.URL) {
          pdfUrl = pdfLink.URL;
        }
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
        metadataProvider: "crossref",
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
}

export const crossrefProvider = new CrossrefProvider();
