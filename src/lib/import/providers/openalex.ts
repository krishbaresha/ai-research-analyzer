import { MetadataProvider } from "./provider.interface";
import { ScholarlyMetadata } from "@/types/import";
import { OpenAccessStatus } from "@/types/document";

/**
 * OpenAlex Metadata & Open Access Provider.
 * Queries OpenAlex API for scholarly works, indexing open-access PDF URLs and citation metadata.
 */
export class OpenAlexProvider implements MetadataProvider {
  readonly name = "openalex";

  async resolveMetadata(doiOrId: string): Promise<ScholarlyMetadata | null> {
    const cleanDoi = doiOrId.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    if (!cleanDoi) return null;

    const url = `https://api.openalex.org/works/https://doi.org/${cleanDoi}`;
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

      const authors = Array.isArray(data.authorships)
        ? data.authorships
            .map((a: { author?: { display_name?: string } }) => a.author?.display_name || "")
            .filter((name: string) => name.length > 0)
        : undefined;

      const publicationYear = typeof data.publication_year === "number" ? data.publication_year : undefined;
      const journalOrConference = data.primary_location?.source?.display_name || undefined;

      // Check open access
      let openAccessStatus: OpenAccessStatus = "unknown";
      let pdfUrl: string | undefined;

      if (data.open_access) {
        const status = data.open_access.oa_status;
        if (["gold", "green", "hybrid", "bronze", "closed"].includes(status)) {
          openAccessStatus = status as OpenAccessStatus;
        }

        // Check if oa_url points to a PDF or primary location pdf_url
        if (typeof data.open_access.oa_url === "string" && data.open_access.oa_url.startsWith("https://")) {
          pdfUrl = data.open_access.oa_url;
        } else if (
          typeof data.primary_location?.pdf_url === "string" &&
          data.primary_location.pdf_url.startsWith("https://")
        ) {
          pdfUrl = data.primary_location.pdf_url;
        }
      }

      return {
        title,
        authors: authors && authors.length > 0 ? authors : undefined,
        publicationYear,
        journalOrConference,
        doi: cleanDoi,
        pdfUrl,
        landingPageUrl: data.doi || `https://doi.org/${cleanDoi}`,
        openAccessStatus,
        metadataProvider: "openalex",
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
}

export const openAlexProvider = new OpenAlexProvider();
