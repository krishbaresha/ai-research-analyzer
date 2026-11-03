import { describe, it, expect } from "vitest";
import { classifyDocument } from "@/lib/pipeline/document-processor";
import { ExtractedPage } from "@/types/document";

describe("Document Classifier (Unit)", () => {
  it("classifies preprints based on arxivId or text cues", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "arXiv:2301.12345v1 [cs.CL] 28 Jan 2023\nA Simple Framework for Contrastive Learning",
        charCount: 200,
        wordCount: 30,
      },
    ];

    expect(classifyDocument(pages, { arxivId: "2301.12345" })).toBe("preprint");
    expect(classifyDocument(pages, {})).toBe("preprint");
  });

  it("classifies review articles and surveys based on title or abstract", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "In this comprehensive survey, we review deep learning models for NLP.",
        charCount: 200,
        wordCount: 25,
      },
    ];

    expect(
      classifyDocument(pages, { title: "A Survey of Large Language Models" })
    ).toBe("review_article");
  });

  it("classifies conference papers from venue metadata", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "Abstract: We present a novel benchmark.",
        charCount: 150,
        wordCount: 20,
      },
    ];

    expect(
      classifyDocument(pages, {
        journalOrConference: "Proceedings of the 40th International Conference on Machine Learning (ICML)",
      })
    ).toBe("conference_paper");
  });

  it("classifies standard research papers with abstract and intro", () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "Abstract: We explore neural representations.\n1. Introduction: Deep models have achieved...",
        charCount: 300,
        wordCount: 40,
      },
    ];

    expect(classifyDocument(pages, { title: "Neural Representations" })).toBe("research_paper");
  });
});
