import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeArxivId, arxivProvider } from "@/lib/import/providers/arxiv";
import { extractDoi, resolveSource } from "@/lib/import/source-resolver";
import { openAlexProvider } from "@/lib/import/providers/openalex";

describe("Source Resolver & Scholarly Adapters (Unit)", () => {
  describe("normalizeArxivId", () => {
    it("normalizes standard arXiv abstract and PDF URLs", () => {
      expect(normalizeArxivId("https://arxiv.org/abs/2301.12345")).toBe("2301.12345");
      expect(normalizeArxivId("https://arxiv.org/pdf/1706.03762.pdf")).toBe("1706.03762");
      expect(normalizeArxivId("http://arxiv.org/abs/2106.09685v2")).toBe("2106.09685");
    });

    it("normalizes prefixed and raw arXiv IDs", () => {
      expect(normalizeArxivId("arxiv:2301.12345")).toBe("2301.12345");
      expect(normalizeArxivId("2301.12345")).toBe("2301.12345");
      expect(normalizeArxivId("1706.03762v5")).toBe("1706.03762");
    });

    it("normalizes legacy arXiv IDs", () => {
      expect(normalizeArxivId("math/0306123")).toBe("math/0306123");
      expect(normalizeArxivId("https://arxiv.org/abs/hep-th/9901001")).toBe("hep-th/9901001");
    });

    it("returns null for non-arXiv inputs", () => {
      expect(normalizeArxivId("10.1145/3318464.3389700")).toBeNull();
      expect(normalizeArxivId("https://example.com/paper.pdf")).toBeNull();
      expect(normalizeArxivId("random text")).toBeNull();
    });
  });

  describe("extractDoi", () => {
    it("extracts DOI from direct string and doi.org URLs", () => {
      expect(extractDoi("10.1145/3318464.3389700")).toBe("10.1145/3318464.3389700");
      expect(extractDoi("https://doi.org/10.1145/3318464.3389700")).toBe("10.1145/3318464.3389700");
      expect(extractDoi("http://dx.doi.org/10.1038/nature12373")).toBe("10.1038/nature12373");
    });

    it("strips trailing punctuation from DOIs", () => {
      expect(extractDoi("Refer to 10.1016/j.cell.2020.08.001.")).toBe("10.1016/j.cell.2020.08.001");
      expect(extractDoi("(10.1109/ICSE.2019.00010)")).toBe("10.1109/ICSE.2019.00010");
    });

    it("returns null for non-DOI inputs", () => {
      expect(extractDoi("https://arxiv.org/abs/2301.12345")).toBeNull();
      expect(extractDoi("https://example.com/paper.pdf")).toBeNull();
    });
  });

  describe("resolveSource", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("resolves arXiv identifier to open-access PDF link and metadata", async () => {
      vi.spyOn(arxivProvider, "resolveMetadata").mockResolvedValueOnce({
        title: "Attention Is All You Need",
        authors: ["Ashish Vaswani", "Noam Shazeer"],
        publicationYear: 2017,
        arxivId: "2301.12345",
        pdfUrl: "https://arxiv.org/pdf/2301.12345.pdf",
        openAccessStatus: "green",
        metadataProvider: "arxiv",
      });

      const res = await resolveSource("2301.12345");
      expect(res.detectedType).toBe("arxiv");
      expect(res.normalizedIdentifier).toBe("2301.12345");
      expect(res.pdfUrl).toBe("https://arxiv.org/pdf/2301.12345.pdf");
      expect(res.isOpenAccess).toBe(true);
      expect(res.fullTextAvailable).toBe(true);
    });

    it("resolves direct HTTPS PDF URL", async () => {
      const res = await resolveSource("https://example.edu/papers/deep-learning.pdf");
      expect(res.detectedType).toBe("direct_url");
      expect(res.pdfUrl).toBe("https://example.edu/papers/deep-learning.pdf");
      expect(res.fullTextAvailable).toBe(true);
      expect(res.metadata?.title).toBe("deep learning");
    });

    it("resolves open-access DOI when provider finds PDF", async () => {
      vi.spyOn(openAlexProvider, "resolveMetadata").mockResolvedValueOnce({
        title: "Open Access Deep Learning Survey",
        authors: ["Alice Smith", "Bob Jones"],
        publicationYear: 2023,
        doi: "10.1000/182",
        pdfUrl: "https://repository.edu/paper.pdf",
        openAccessStatus: "gold",
        metadataProvider: "openalex",
      });

      const res = await resolveSource("10.1000/182");
      expect(res.detectedType).toBe("doi");
      expect(res.fullTextAvailable).toBe(true);
      expect(res.pdfUrl).toBe("https://repository.edu/paper.pdf");
      expect(res.metadata?.title).toBe("Open Access Deep Learning Survey");
    });

    it("marks paywalled DOI as fullTextAvailable: false with informative notice", async () => {
      vi.spyOn(openAlexProvider, "resolveMetadata").mockResolvedValueOnce({
        title: "Paywalled Proprietary Journal Paper",
        authors: ["Carol White"],
        publicationYear: 2021,
        doi: "10.1000/paywall123",
        openAccessStatus: "closed",
        metadataProvider: "openalex",
      });

      const res = await resolveSource("10.1000/paywall123");
      expect(res.detectedType).toBe("doi");
      expect(res.fullTextAvailable).toBe(false);
      expect(res.accessNote).toContain("not publicly accessible via open access");
      expect(res.landingPageUrl).toBe("https://doi.org/10.1000/paywall123");
    });

    it("identifies Google Books URLs and returns clear educational guidance", async () => {
      const res = await resolveSource(
        "https://books.google.com.pk/books?hl=en&lr=&id=yDQTDAAAQBAJ&oi=fnd&pg=PP1&dq=ai"
      );
      expect(res.detectedType).toBe("unsupported");
      expect(res.fullTextAvailable).toBe(false);
      expect(res.accessNote).toContain("Google Books links are copyright-protected web viewer pages");
    });

    it("returns unsupported for invalid strings", async () => {
      const res = await resolveSource("not-a-url-or-doi");
      expect(res.detectedType).toBe("unsupported");
      expect(res.fullTextAvailable).toBe(false);
    });
  });
});
