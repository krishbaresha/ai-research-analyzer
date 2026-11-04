import { describe, it, expect } from "vitest";
import { parseAndValidateResearchExplorer } from "@/lib/ai/explorer-parsers";
import { researchExplorerDataSchema } from "@/lib/validation/research-explorer.schema";
import { AIResponseParseError } from "@/lib/ai/provider";
import { ExtractedDocument } from "@/types/document";

describe("Research Explorer Parser & Schema Validator (Unit)", () => {
  const dummyDocument: ExtractedDocument = {
    metadata: {
      id: "doc_test_123",
      originalFilename: "deep-residual-learning.pdf",
      sanitizedFilename: "deep-residual-learning.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 102400,
      pageCount: 12,
      totalWordCount: 4500,
      totalCharCount: 28000,
      isScanned: false,
      ocrRequired: false,
      isEncrypted: false,
      uploadedAt: new Date().toISOString(),
      title: "Deep Residual Learning for Image Recognition",
      authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
      publicationYear: 2016,
      journalOrConference: "CVPR 2016",
      doi: "10.1109/CVPR.2016.90",
      sourceType: "upload",
      openAccessStatus: "gold",
    },
    pages: [
      { pageNumber: 1, text: "Deeper neural networks are more difficult to train.", charCount: 50, wordCount: 8 },
      { pageNumber: 2, text: "Residual learning framework explicitly lets layers fit a residual mapping.", charCount: 75, wordCount: 10 },
    ],
    fullText: "Deeper neural networks are more difficult to train. Residual learning framework explicitly lets layers fit a residual mapping.",
  };

  const validExplorerPayload = {
    documentId: "doc_test_123",
    modelId: "gpt-4o-mini",
    identity: {
      title: "Deep Residual Learning for Image Recognition",
      authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
      publicationYear: 2016,
      journalOrConference: "CVPR 2016",
      doi: "10.1109/CVPR.2016.90",
      openAccessStatus: "gold",
      researchDomain: "Computer Vision & Deep Learning",
      pageCount: 12,
      sourceType: "upload",
    },
    executiveOverview: {
      beginnerExplanation: "As neural networks get deeper, they paradoxically become harder to train because signals fade. This paper fixes that by adding skip connections.",
      beginnerAnalogy: "Like adding express bypass lanes on a crowded highway so vehicles can skip stop-and-go congestion.",
      technicalContribution: "Introduced deep residual learning reformulation F(x) + x allowing 152-layer networks to optimize smoothly.",
      problemAddressed: "Degradation problem where deep networks saturate in accuracy then rapidly degrade during training.",
      whyItMatters: "Enabled unprecedented network depth (152 layers vs 22 layers in GoogLeNet) and won ImageNet 2015.",
      whatDiscovered: "Residual networks are easier to optimize and gain substantial accuracy from increased depth.",
      whoBenefits: ["Computer vision practitioners", "Autonomous driving engineers", "Deep learning researchers"],
    },
    atAGlance: {
      coreObjective: {
        label: "Core Objective",
        headline: "Train extremely deep networks via residual representations",
        detail: "Reformulate layers as learning residual functions with reference to layer inputs.",
        status: "from_document",
        pageReferences: [1, 2],
      },
      methodologyApproach: {
        label: "Methodology",
        headline: "Identity shortcut connections bypass one or more layers",
        detail: "Shortcuts perform identity mapping with zero additional parameters and computational complexity.",
        status: "from_document",
        pageReferences: [2, 3],
      },
      datasetOrSample: {
        label: "Dataset / Sample",
        headline: "ImageNet 2012 classification dataset",
        detail: "1.28 million training images and 50k validation images across 1,000 classes.",
        status: "from_document",
        pageReferences: [5],
      },
      keyEmpiricalResult: {
        label: "Empirical Result",
        headline: "3.57% top-5 error on ImageNet test set",
        detail: "Won 1st place in ILSVRC 2015 classification task using an ensemble of 152-layer ResNets.",
        status: "from_document",
        pageReferences: [6],
      },
      computationalCost: {
        label: "Computational Cost",
        headline: "FLOPs comparable or lower than VGG-16",
        detail: "ResNet-152 has 11.3 billion FLOPs compared to VGG-16 with 15.3 billion FLOPs.",
        status: "from_document",
        pageReferences: [4],
      },
      primaryLimitations: {
        label: "Limitations",
        headline: "Deeper networks require substantial GPU memory during training",
        detail: "Batch size constraints and memory footprint grow with network depth.",
        status: "ai_interpretation",
        pageReferences: [9],
      },
      reproducibilityStatus: {
        label: "Reproducibility",
        headline: "Full hyperparameter tables and publicly available code",
        detail: "Trained using SGD, weight decay 0.0001, momentum 0.9, mini-batch of 256.",
        status: "from_document",
        pageReferences: [4, 5],
      },
      ethicalStatus: {
        label: "Ethical & Societal Impact",
        headline: "General vision foundation with dual-use considerations",
        detail: "No dedicated ethics section present in original 2016 publication.",
        status: "not_reported",
        pageReferences: [],
      },
    },
    sections: [
      {
        id: "dim-1",
        sectionNumber: 1,
        title: "The Degradation Problem in Deep Architectures",
        cluster: "foundation",
        beginnerExplanation: "When researchers made neural networks deeper, they expected better accuracy, but surprisingly the models got worse even on training data.",
        researcherTechnical: "With network depth increasing, accuracy gets saturated and degrades rapidly without being caused by overfitting.",
        evidenceStatus: "from_document",
        pageReferences: [1],
        quote: "When deeper networks are able to start converging, a degradation problem has been exposed.",
        bulletPoints: ["Observed on ImageNet and CIFAR-10", "Not caused by vanishing gradients (BN applied)", "Optimization difficulty identified as root cause"],
      },
    ],
    reconstructedCharts: [
      {
        id: "chart-1",
        title: "Top-1 Error Rate on ImageNet Validation (20 vs 56 Layers)",
        chartType: "bar",
        xAxisLabel: "Network Depth Architecture",
        yAxisLabel: "Error Rate (%)",
        unit: "%",
        sourceTableOrSection: "Table 1 & Figure 1",
        pageNumber: 3,
        caption: "Comparing 20-layer and 56-layer plain networks showing optimization failure on deeper models.",
        data: [
          { category: "Plain-20", value: 27.88, baseline: true },
          { category: "Plain-56", value: 28.52, baseline: true },
          { category: "ResNet-20", value: 25.12, isProposed: true },
          { category: "ResNet-56", value: 23.24, isProposed: true },
        ],
      },
    ],
    workflowDiagrams: [
      {
        id: "diag-1",
        title: "Residual Learning Block Pipeline",
        diagramType: "pipeline",
        caption: "Residual unit with identity shortcut connection mapping x directly to output.",
        sourcePage: 2,
        steps: [
          { stepNumber: 1, title: "Input Tensor (x)", description: "Pass input feature map into the residual block." },
          { stepNumber: 2, title: "Weight Layers (Weight + ReLU)", description: "Compute non-linear transformation F(x)." },
          { stepNumber: 3, title: "Identity Shortcut Addition", description: "Perform element-wise addition F(x) + x." },
          { stepNumber: 4, title: "Output Activation", description: "Apply final ReLU activation to the summation." },
        ],
      },
    ],
    glossary: [
      {
        term: "Residual Mapping",
        plainDefinition: "Learning the difference or change between the input and target, rather than the whole transformation from scratch.",
        technicalDefinition: "Formulation F(x) = H(x) - x, allowing layers to approximate residual functions rather than unreferenced mappings.",
        analogy: "Like tracking your net change in bank balance rather than re-counting every cent each week.",
        pageReferences: [2],
      },
    ],
    keyCitations: [
      {
        citationText: "Simonyan & Zisserman (2014) - Very Deep Convolutional Networks (VGG)",
        relevance: "Establishes baseline deep convolutional architectures with small 3x3 filters.",
        isBaseline: true,
        pageReferences: [2, 4],
      },
    ],
  };

  it("validates a full schema compliant research explorer payload", () => {
    const parseResult = researchExplorerDataSchema.safeParse(validExplorerPayload);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.executiveOverview.beginnerAnalogy).toContain("express bypass lanes");
      expect(parseResult.data.reconstructedCharts).toHaveLength(1);
      expect(parseResult.data.reconstructedCharts[0].data[0].category).toBe("Plain-20");
    }
  });

  it("parses raw JSON string with code fences and enriches with verified document metadata", () => {
    const rawFenced = "```json\n" + JSON.stringify(validExplorerPayload) + "\n```";
    const result = parseAndValidateResearchExplorer(
      rawFenced,
      "gpt-4o-mini",
      dummyDocument.metadata.id,
      dummyDocument.metadata
    );

    expect(result.documentId).toBe("doc_test_123");
    expect(result.modelId).toBe("gpt-4o-mini");
    expect(result.identity.title).toBe("Deep Residual Learning for Image Recognition");
    expect(result.identity.authors).toEqual(["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"]);
    expect(result.identity.publicationYear).toBe(2016);
    expect(result.atAGlance.coreObjective.status).toBe("from_document");
    expect(result.glossary[0].term).toBe("Residual Mapping");
  });

  it("resiliently coerces LLM string outputs for metric cards and page references", () => {
    const loosePayload = {
      ...validExplorerPayload,
      atAGlance: {
        ...validExplorerPayload.atAGlance,
        coreObjective: "Direct string returned by LLM instead of metric object",
      },
      sections: [
        {
          id: "dim-1",
          sectionNumber: "1", // string number
          title: "Introduction",
          cluster: "foundation",
          beginnerExplanation: "Simple explanation",
          researcherTechnical: "Technical explanation",
          evidenceStatus: "verified", // coerced to from_document
          pageReferences: "1, 2", // string page list
        },
      ],
    };

    const parseResult = researchExplorerDataSchema.safeParse(loosePayload);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.atAGlance.coreObjective.label).toBe("Metric");
      expect(parseResult.data.atAGlance.coreObjective.headline).toContain("Direct string returned");
      expect(parseResult.data.sections[0].evidenceStatus).toBe("from_document");
      expect(parseResult.data.sections[0].pageReferences).toEqual([1, 2]);
    }
  });

  it("handles null values in identity (e.g. arxivId: null, doi: null) without throwing schema error", () => {
    const payloadWithNulls = {
      ...validExplorerPayload,
      identity: {
        ...validExplorerPayload.identity,
        arxivId: null,
        doi: null,
        journalOrConference: null,
        openAccessStatus: null,
      },
    };

    const rawJson = JSON.stringify(payloadWithNulls);
    const result = parseAndValidateResearchExplorer(
      rawJson,
      "gpt-4o-mini",
      dummyDocument.metadata.id,
      dummyDocument.metadata
    );

    expect(result.identity.title).toBe(validExplorerPayload.identity.title);
  });

  it("coerces raw string array for workflowDiagrams steps into structured step objects", () => {
    const payloadWithRawStepStrings = {
      ...validExplorerPayload,
      workflowDiagrams: [
        {
          id: "diag-raw",
          title: "Raw Step Diagram",
          diagramType: "pipeline",
          caption: "Pipeline test",
          sourcePage: 1,
          steps: [
            "Data Extraction: Parse PDF pages into memory",
            "Embedding Generation: Pass passages to model",
            "Evaluation: Benchmark against ground truth",
          ],
        },
      ],
    };

    const rawJson = JSON.stringify(payloadWithRawStepStrings);
    const result = parseAndValidateResearchExplorer(
      rawJson,
      "gpt-4o-mini",
      dummyDocument.metadata.id,
      dummyDocument.metadata
    );

    expect(result.workflowDiagrams[0].steps).toHaveLength(3);
    expect(result.workflowDiagrams[0].steps[0].title).toBe("Data Extraction");
    expect(result.workflowDiagrams[0].steps[0].stepNumber).toBe(1);
    expect(result.workflowDiagrams[0].steps[1].stepNumber).toBe(2);
  });

  it("throws AIResponseParseError when input is completely unparseable", () => {
    expect(() =>
      parseAndValidateResearchExplorer("Not JSON at all", "gpt-4o-mini", dummyDocument.metadata.id, dummyDocument.metadata)
    ).toThrow(AIResponseParseError);
  });
});
