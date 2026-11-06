import { z } from "zod";
import { pageReferencesCoerce, stringArrayCoerce } from "./research.schema";

export const explorerEvidenceStatusSchema = z.preprocess((val: unknown) => {
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    if (s.includes("document") || s.includes("empirical") || s.includes("fact") || s.includes("verif") || s.includes("found")) return "from_document";
    if (s.includes("ai") || s.includes("interpret") || s.includes("eval") || s.includes("synthes") || s.includes("model")) return "ai_interpretation";
    if (s.includes("not_reported") || s.includes("omitted") || s.includes("none") || s.includes("missing")) return "not_reported";
    if (s.includes("not_established") || s.includes("unverified") || s.includes("unknown") || s.includes("gap")) return "not_established";
    return "from_document";
  }
  return "from_document";
}, z.enum(["from_document", "ai_interpretation", "not_reported", "not_established"]).default("from_document"));

export const researchIdentitySchema = z.preprocess(
  (val) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        ...obj,
        title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : "Academic Research Paper",
        arxivId: typeof obj.arxivId === "string" && obj.arxivId.trim() ? obj.arxivId.trim() : undefined,
        doi: typeof obj.doi === "string" && obj.doi.trim() ? obj.doi.trim() : undefined,
        journalOrConference: typeof obj.journalOrConference === "string" && obj.journalOrConference.trim() ? obj.journalOrConference.trim() : undefined,
        openAccessStatus: typeof obj.openAccessStatus === "string" && obj.openAccessStatus.trim() ? obj.openAccessStatus.trim() : undefined,
        researchDomain: typeof obj.researchDomain === "string" && obj.researchDomain.trim() ? obj.researchDomain.trim() : "Computer Science / Artificial Intelligence",
      };
    }
    return val;
  },
  z.object({
    title: z.string().min(1).default("Academic Research Paper"),
    authors: stringArrayCoerce.default([]),
    publicationYear: z.union([z.string(), z.number()]).nullish(),
    journalOrConference: z.string().nullish(),
    doi: z.string().nullish(),
    arxivId: z.string().nullish(),
    openAccessStatus: z.string().nullish(),
    researchDomain: z.string().default("Computer Science / Artificial Intelligence"),
    pageCount: z.preprocess(
      (v) => (typeof v === "number" && v > 0 ? v : parseInt(String(v || 1), 10) || 1),
      z.number().int().positive().default(1)
    ),
    sourceType: z.string().default("uploaded_pdf"),
  })
);

export function cleanReadableSectionText(
  val: unknown,
  fallback = "Analysis documented in source material."
): string {
  if (val === null || val === undefined) return fallback;

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed === "[object Object]" ||
      trimmed === "{}" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === ""
    ) {
      return fallback;
    }
    // If the string starts with JSON markers, attempt to parse and format
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return cleanReadableSectionText(parsed, fallback);
      } catch {
        // Return raw string if not valid JSON
      }
    }
    return trimmed;
  }

  if (Array.isArray(val)) {
    const formatted = val
      .map((item) => {
        if (typeof item === "string") {
          const s = item.trim();
          return s && s !== "[object Object]" ? `• ${s}` : "";
        }
        if (typeof item === "object" && item !== null) {
          const entries = Object.entries(item)
            .filter(([, v]) => v !== null && v !== undefined && String(v) !== "[object Object]")
            .map(([k, v]) => `${formatKeyTitle(k)}: ${typeof v === "object" ? cleanReadableSectionText(v, "") : String(v)}`)
            .join(". ");
          return entries ? `• ${entries}` : "";
        }
        return `• ${String(item)}`;
      })
      .filter(Boolean)
      .join("\n\n");
    return formatted || fallback;
  }

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // Check known string direct properties
    const directKeys = [
      "text",
      "description",
      "summary",
      "explanation",
      "detail",
      "content",
      "overview",
      "plain",
      "technical",
    ];
    for (const key of directKeys) {
      if (
        typeof obj[key] === "string" &&
        obj[key].trim() &&
        obj[key] !== "[object Object]"
      ) {
        return (obj[key] as string).trim();
      }
    }

    // Otherwise format structured key-value pairs
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue;
      const label = formatKeyTitle(k);
      if (typeof v === "string" && v.trim() && v !== "[object Object]") {
        pairs.push(`**${label}:** ${v.trim()}`);
      } else if (Array.isArray(v)) {
        const list = v
          .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
          .filter((s) => s !== "[object Object]")
          .join(", ");
        if (list) pairs.push(`**${label}:** ${list}`);
      } else if (typeof v === "object") {
        const nested = cleanReadableSectionText(v, "");
        if (nested && nested !== fallback) {
          pairs.push(`**${label}:**\n${nested}`);
        }
      } else {
        pairs.push(`**${label}:** ${String(v)}`);
      }
    }
    if (pairs.length > 0) {
      return pairs.join("\n\n");
    }
  }

  const str = String(val);
  return str === "[object Object]" ? fallback : str;
}

function formatKeyTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function getSectionDefaultContent(title: string, _cluster: string): { beginner: string; technical: string } {
  const t = title.toLowerCase();

  if (t.includes("threat") || t.includes("validity")) {
    return {
      beginner: "Explains factors that might limit how widely the study's conclusions apply, such as specific benchmark conditions, evaluation surrogate metrics, or synthetic data constraints.",
      technical: "Evaluates internal validity (confounding variables and attribution), external validity (generalizability across real-world domains), construct validity (surrogate metric alignment), and statistical conclusion validity.",
    };
  }
  if (t.includes("ethic")) {
    return {
      beginner: "Discusses responsible research practices, societal impact, safety safeguards, and prevention of automated misuse in scientific discovery.",
      technical: "Examines ethical risk vectors, compliance with institutional research guidelines, computational environmental footprints, dual-use implications, and safety mitigation protocols.",
    };
  }
  if (t.includes("reproducib") || t.includes("open science")) {
    return {
      beginner: "Details whether experimental code, models, and evaluation datasets are publicly accessible so other researchers can verify and replicate results.",
      technical: "Documents open release status of source repositories, pre-trained weights, random seed protocols, hyperparameter schedules, and computational execution environments.",
    };
  }
  if (t.includes("implication")) {
    return {
      beginner: "Highlights how this research breakthrough influences future technology and practical tools for students, engineers, and researchers.",
      technical: "Delineates foundational theoretical contributions, paradigm shifts, and practical engineering integrations for downstream academic and industrial applications.",
    };
  }
  if (t.includes("future") || t.includes("direction")) {
    return {
      beginner: "Outlines exciting next steps and open challenges where upcoming research projects and student theses can build upon this paper.",
      technical: "Specifies open empirical avenues, algorithmic extensions, multi-domain scaling frontiers, and unaddressed benchmark challenges for follow-up scientific investigation.",
    };
  }
  if (t.includes("strength")) {
    return {
      beginner: "Highlights the main advantages, novel discoveries, and verified improvements demonstrated by this research paper.",
      technical: "Synthesizes evidenced algorithmic advancements, superior empirical metrics over baselines, and theoretical rigor documented in the manuscript.",
    };
  }
  if (t.includes("limitation")) {
    return {
      beginner: "Explains boundaries, edge cases, and conditions where the proposed system or theory might struggle or fail.",
      technical: "Details bounded domain constraints, computational cost limitations, dataset sampling biases, and observed error modes under adversarial conditions.",
    };
  }

  return {
    beginner: `Detailed plain-language conceptual explanation for ${title} grounded in published paper evidence.`,
    technical: `Peer-review-grade technical specification and empirical parameters for ${title} documented in the source manuscript.`,
  };
}

export const executiveResearchOverviewSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        ...obj,
        beginnerExplanation: cleanReadableSectionText(
          obj.beginnerExplanation ?? obj.summary ?? obj.overview,
          "This paper explores an academic research question."
        ),
        beginnerAnalogy: cleanReadableSectionText(
          obj.beginnerAnalogy ?? obj.analogy,
          "Imagine a process where multiple components collaborate in parallel."
        ),
        technicalContribution: cleanReadableSectionText(
          obj.technicalContribution ?? obj.contribution,
          "Presents an empirical methodology and theoretical contribution."
        ),
        problemAddressed: cleanReadableSectionText(
          obj.problemAddressed ?? obj.problem,
          "Addressing existing computational or theoretical bottlenecks."
        ),
        whyItMatters: cleanReadableSectionText(
          obj.whyItMatters ?? obj.significance,
          "Enables more efficient and scalable academic inquiry."
        ),
        whatDiscovered: cleanReadableSectionText(
          obj.whatDiscovered ?? obj.discovery ?? obj.result,
          "Achieved measurable empirical improvements over tested baselines."
        ),
      };
    }
    return val;
  },
  z.object({
    beginnerExplanation: z.string().min(1).default("This paper explores an academic research question."),
    beginnerAnalogy: z.string().default("Imagine a process where multiple components collaborate in parallel."),
    technicalContribution: z.string().min(1).default("Presents an empirical methodology and theoretical contribution."),
    problemAddressed: z.string().default("Addressing existing computational or theoretical bottlenecks."),
    whyItMatters: z.string().default("Enables more efficient and scalable academic inquiry."),
    whatDiscovered: z.string().default("Achieved measurable empirical improvements over tested baselines."),
    whoBenefits: stringArrayCoerce.default(["Academic researchers", "Industry practitioners", "Students"]),
  })
);

export const metricCardSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "string") {
      const text = cleanReadableSectionText(val, "Reported");
      return {
        label: "Metric",
        headline: text.slice(0, 80),
        detail: text,
        status: "from_document",
        pageReferences: [],
      };
    }
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        label: typeof obj.label === "string" ? obj.label : "Metric",
        headline: cleanReadableSectionText(
          obj.headline ?? obj.title ?? obj.value ?? obj.text,
          "Reported"
        ).slice(0, 80),
        detail: cleanReadableSectionText(
          obj.detail ?? obj.description ?? obj.text ?? obj.headline,
          "Document evidence"
        ),
        status: obj.status || "from_document",
        pageReferences: obj.pageReferences || [],
      };
    }
    return val;
  },
  z.object({
    label: z.string().default("Metric"),
    headline: z.string().min(1).default("Reported"),
    detail: z.string().default(""),
    status: explorerEvidenceStatusSchema,
    pageReferences: pageReferencesCoerce,
  })
);

export const researchAtAGlanceSchema = z.object({
  coreObjective: metricCardSchema,
  methodologyApproach: metricCardSchema,
  datasetOrSample: metricCardSchema,
  keyEmpiricalResult: metricCardSchema,
  computationalCost: metricCardSchema,
  primaryLimitations: metricCardSchema,
  reproducibilityStatus: metricCardSchema,
  ethicalStatus: metricCardSchema,
});

export const explorerSectionItemSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      const title =
        typeof obj.title === "string" && obj.title.trim()
          ? obj.title.trim()
          : typeof obj.heading === "string" && obj.heading.trim()
          ? obj.heading.trim()
          : "Research Dimension";

      const clusterVal = (obj.cluster as string) || "foundation";
      const cluster = ["foundation", "methodology", "experiments", "evaluation", "impact"].includes(clusterVal)
        ? (clusterVal as "foundation" | "methodology" | "experiments" | "evaluation" | "impact")
        : "foundation";

      const defaults = getSectionDefaultContent(title, cluster);

      const beginnerExplanation = cleanReadableSectionText(
        obj.beginnerExplanation ?? obj.beginnerText ?? obj.summary ?? obj.content,
        defaults.beginner
      );

      const researcherTechnical = cleanReadableSectionText(
        obj.researcherTechnical ?? obj.technicalDetail ?? obj.detail ?? obj.content ?? obj.beginnerExplanation,
        defaults.technical
      );

      return {
        id: obj.id || `sec_${Math.random().toString(36).substring(2, 9)}`,
        sectionNumber: typeof obj.sectionNumber === "number" ? obj.sectionNumber : 1,
        title,
        cluster,
        beginnerExplanation,
        researcherTechnical,
        evidenceStatus: obj.evidenceStatus || obj.status || "from_document",
        pageReferences: obj.pageReferences || [],
        quote: typeof obj.quote === "string" && obj.quote !== "[object Object]" ? obj.quote : undefined,
        bulletPoints: Array.isArray(obj.bulletPoints) ? obj.bulletPoints : [],
        keyValuePairs: Array.isArray(obj.keyValuePairs) ? obj.keyValuePairs : [],
      };
    }
    return val;
  },
  z.object({
    id: z.string().default(() => `sec_${Math.random().toString(36).substring(2, 9)}`),
    sectionNumber: z.number().int().default(1),
    title: z.string().min(1).default("Section"),
    cluster: z.enum(["foundation", "methodology", "experiments", "evaluation", "impact"]).default("foundation"),
    beginnerExplanation: z.string().min(1).default(""),
    researcherTechnical: z.string().min(1).default(""),
    evidenceStatus: explorerEvidenceStatusSchema,
    pageReferences: pageReferencesCoerce,
    quote: z.string().nullish(),
    bulletPoints: stringArrayCoerce.default([]),
    keyValuePairs: z
      .array(
        z.object({
          key: z.string().default("Key"),
          value: z.string().default("Value"),
          page: z.number().nullish(),
        })
      )
      .default([]),
  })
);

export const chartDataPointSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      const rawNum = typeof obj.value === "number" ? obj.value : parseFloat(String(obj.value || 0));
      return {
        category: String(obj.category || obj.name || obj.label || "Sample"),
        value: isNaN(rawNum) ? 0 : rawNum,
        isProposed: Boolean(obj.isProposed || obj.proposed || obj.ours),
        baseline: Boolean(obj.baseline),
      };
    }
    return val;
  },
  z.object({
    category: z.string().min(1),
    value: z.number(),
    isProposed: z.boolean().default(false),
    baseline: z.boolean().default(false),
  })
);

export const reconstructedChartSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        ...obj,
        unit: typeof obj.unit === "string" && obj.unit.trim() ? obj.unit.trim() : "Score",
        sourceTableOrSection: typeof obj.sourceTableOrSection === "string" && obj.sourceTableOrSection.trim() ? obj.sourceTableOrSection.trim() : "Results Table",
        caption: typeof obj.caption === "string" && obj.caption.trim() ? obj.caption.trim() : "Reconstructed from published tabular data.",
      };
    }
    return val;
  },
  z.object({
    id: z.string().default(() => `chart_${Math.random().toString(36).substring(2, 9)}`),
    title: z.string().min(1).default("Benchmark Comparison"),
    chartType: z.enum(["bar", "line", "comparison"]).default("bar"),
    xAxisLabel: z.string().default("Model / Condition"),
    yAxisLabel: z.string().default("Metric Value"),
    unit: z.string().default("Score"),
    sourceTableOrSection: z.string().default("Results Table"),
    pageNumber: z.number().int().positive().default(1),
    caption: z.string().default("Reconstructed from published tabular data."),
    data: z.array(chartDataPointSchema).default([]),
  })
);

export const workflowStepSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "string") {
      const parts = val.split(/[:.-]/);
      const title = parts.length > 1 ? parts[0].trim() : val.slice(0, 60);
      return {
        stepNumber: 1,
        title: title || "Process Step",
        description: val,
        technicalNote: undefined,
        pageReference: undefined,
      };
    }
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      const stepNum = typeof obj.stepNumber === "number" ? obj.stepNumber : parseInt(String(obj.stepNumber || obj.step || 1), 10);
      return {
        stepNumber: isNaN(stepNum) ? 1 : stepNum,
        title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : typeof obj.name === "string" ? obj.name : "Process Step",
        description: typeof obj.description === "string" ? obj.description : typeof obj.detail === "string" ? obj.detail : String(obj.title || ""),
        technicalNote: typeof obj.technicalNote === "string" ? obj.technicalNote : undefined,
        pageReference: typeof obj.pageReference === "number" ? obj.pageReference : undefined,
      };
    }
    return val;
  },
  z.object({
    stepNumber: z.number().int().default(1),
    title: z.string().min(1).default("Process Step"),
    description: z.string().default(""),
    technicalNote: z.string().nullish(),
    pageReference: z.number().nullish(),
  })
);

export const workflowDiagramSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      let rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
      rawSteps = rawSteps.map((s, idx) => {
        if (typeof s === "string") {
          const parts = s.split(/[:.-]/);
          const title = parts.length > 1 && parts[0].length < 40 ? parts[0].trim() : `Step ${idx + 1}`;
          return {
            stepNumber: idx + 1,
            title,
            description: s,
          };
        }
        if (typeof s === "object" && s !== null) {
          const sObj = s as Record<string, unknown>;
          return {
            ...sObj,
            stepNumber: typeof sObj.stepNumber === "number" ? sObj.stepNumber : idx + 1,
          };
        }
        return s;
      });
      return {
        ...obj,
        caption: typeof obj.caption === "string" && obj.caption.trim() ? obj.caption.trim() : "Synthesized research execution flow.",
        steps: rawSteps,
      };
    }
    return val;
  },
  z.object({
    id: z.string().default(() => `diag_${Math.random().toString(36).substring(2, 9)}`),
    title: z.string().min(1).default("Methodology Workflow"),
    diagramType: z.preprocess(
      (v) => (typeof v === "string" && ["pipeline", "architecture", "concept_map"].includes(v.toLowerCase()) ? v.toLowerCase() : "pipeline"),
      z.enum(["pipeline", "architecture", "concept_map"]).default("pipeline")
    ),
    caption: z.string().default("Synthesized research execution flow."),
    sourcePage: z.number().int().positive().default(1),
    steps: z.array(workflowStepSchema).default([]),
  })
);

export const glossaryTermSchema = z.object({
  term: z.string().min(1).default("Term"),
  plainDefinition: z.string().min(1).default(""),
  technicalDefinition: z.string().min(1).default(""),
  analogy: z.string().nullish(),
  pageReferences: pageReferencesCoerce,
});

export const keyCitationSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return {
        ...obj,
        relevance: typeof obj.relevance === "string" && obj.relevance.trim() ? obj.relevance.trim() : "Baseline comparison",
      };
    }
    return val;
  },
  z.object({
    citationText: z.string().min(1).default("Citation"),
    relevance: z.string().default("Baseline comparison"),
    isBaseline: z.boolean().default(false),
    pageReferences: pageReferencesCoerce,
  })
);

export const researchExplorerDataSchema = z.object({
  id: z.string().default(() => `exp_${Math.random().toString(36).substring(2, 10)}`),
  documentId: z.string().min(1),
  identity: researchIdentitySchema,
  executiveOverview: executiveResearchOverviewSchema,
  atAGlance: researchAtAGlanceSchema,
  sections: z.array(explorerSectionItemSchema).default([]),
  reconstructedCharts: z.array(reconstructedChartSchema).default([]),
  workflowDiagrams: z.array(workflowDiagramSchema).default([]),
  glossary: z.array(glossaryTermSchema).default([]),
  keyCitations: z.array(keyCitationSchema).default([]),
  modelId: z.string(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedResearchExplorerData = z.infer<typeof researchExplorerDataSchema>;
